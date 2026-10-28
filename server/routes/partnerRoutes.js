// server/routes/partnerRoutes.js
import express from 'express';
import { repo } from '../repository/memoryRepository.js';
import { checkActivationGate } from '../logic/activationGate.js';
import { recalculateQualityScore } from '../logic/qualityScoreEngine.js';
import { logAction } from '../logic/auditLogger.js';
import { DOCUMENT_TYPES, KYC_STATUS, REJECT_REASON_CODES, BACKGROUND_CHECK_STATUS } from '../../shared/constants.js';

const router = express.Router();

// Get all partners
router.get('/', async (req, res) => {
  try {
    const partners = await repo.getAllPartners();
    res.json({ success: true, count: partners.length, data: partners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single partner by ID
router.get('/:id', async (req, res) => {
  try {
    const partner = await repo.getPartnerById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });
    res.json({ success: true, data: partner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Module 1.1: Application Intake
router.post('/apply', async (req, res) => {
  try {
    const { name, phone, email, cityId, cityName, skills, documents, actor = 'PARTNER_APPLICANT' } = req.body;

    if (!name || !phone || !cityId) {
      return res.status(400).json({ success: false, error: 'Mandatory fields missing: name, phone, cityId are required' });
    }

    const partnerId = `partner_${Date.now()}`;
    const formattedDocs = {};

    DOCUMENT_TYPES.forEach(docType => {
      formattedDocs[docType] = {
        docType,
        url: documents?.[docType]?.url || `https://storage.bharatpro.in/docs/${docType.toLowerCase()}_submitted.png`,
        status: 'PENDING',
        verifiedAt: null
      };
    });

    const newPartner = {
      id: partnerId,
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@bharatpro.in`,
      cityId,
      cityName: cityName || 'Gurugram',
      skills: skills || ['Cleaning'],
      skillTags: skills || ['Cleaning'],
      assessmentPassed: false,
      trainingCompleted: false,
      trainingStatus: 'INCOMPLETE',
      kycStatus: KYC_STATUS.PENDING_VERIFICATION,
      backgroundCheckStatus: BACKGROUND_CHECK_STATUS.PENDING,
      documents: formattedDocs,
      avgRating: 5.0,
      reworkRate: 0.0,
      cancellationRate: 0.0,
      performanceScore: 200,
      tier: 'GOLD',
      commissionRate: 0.12,
      isActive: false,
      status: 'INACTIVE',
      lat: 28.4595,
      lng: 77.0266,
      walletBalance: 0
    };

    const saved = await repo.savePartner(newPartner);

    logAction({
      actor,
      action: 'PARTNER_APPLICATION_SUBMITTED',
      targetType: 'PARTNER',
      targetId: saved.id,
      after: { id: saved.id, name: saved.name, status: saved.status },
      reason: 'Partner application intake submission'
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Module 1.2: KYC Document Review (Approve or Reject document)
router.post('/:id/kyc-review', async (req, res) => {
  try {
    const { docType, status, rejectReasonCode, actor = 'ADMIN_KYC' } = req.body;
    const partner = await repo.getPartnerById(req.params.id);

    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });
    if (!DOCUMENT_TYPES.includes(docType)) return res.status(400).json({ success: false, error: `Invalid document type '${docType}'` });
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, error: "Status must be 'APPROVED' or 'REJECTED'" });

    if (status === 'REJECTED') {
      if (!rejectReasonCode || !REJECT_REASON_CODES[rejectReasonCode]) {
        return res.status(400).json({
          success: false,
          error: `Rejection requires a valid reason code from [${Object.keys(REJECT_REASON_CODES).join(', ')}]`
        });
      }
    }

    const docBefore = partner.documents[docType];
    partner.documents[docType] = {
      ...docBefore,
      status,
      rejectReasonCode: status === 'REJECTED' ? rejectReasonCode : null,
      verifiedAt: new Date().toISOString()
    };

    logAction({
      actor,
      action: `KYC_DOC_${status}`,
      targetType: 'PARTNER',
      targetId: partner.id,
      before: docBefore,
      after: partner.documents[docType],
      reason: status === 'REJECTED' ? REJECT_REASON_CODES[rejectReasonCode] : 'Document approved during KYC review'
    });

    // Check overall documents status
    const allDocValues = Object.values(partner.documents);
    const hasRejected = allDocValues.some(d => d.status === 'REJECTED');
    const allApproved = allDocValues.every(d => d.status === 'APPROVED');

    if (hasRejected) {
      partner.kycStatus = KYC_STATUS.KYC_REJECTED;
    } else if (allApproved) {
      // Trigger background check simulation (mock function)
      partner.kycStatus = KYC_STATUS.KYC_HOLD;
      partner.backgroundCheckStatus = BACKGROUND_CHECK_STATUS.PENDING;

      setTimeout(async () => {
        partner.kycStatus = KYC_STATUS.KYC_CLEARED;
        partner.backgroundCheckStatus = BACKGROUND_CHECK_STATUS.CLEARED;

        // Re-check activation gate
        const gateResult = checkActivationGate(partner);
        partner.isActive = gateResult.isActive;
        partner.status = gateResult.status;

        await repo.savePartner(partner);

        logAction({
          actor: 'BACKGROUND_CHECK_SERVICE',
          action: 'BACKGROUND_CHECK_COMPLETED',
          targetType: 'PARTNER',
          targetId: partner.id,
          after: { kycStatus: partner.kycStatus, backgroundCheckStatus: partner.backgroundCheckStatus, isActive: partner.isActive },
          reason: 'Automated background check returned CLEARED'
        });
      }, 3000);
    }

    // Re-check activation gate synchronously
    const gateResult = checkActivationGate(partner);
    partner.isActive = gateResult.isActive;
    partner.status = gateResult.status;

    const saved = await repo.savePartner(partner);
    res.json({ success: true, data: saved, gateResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Module 1.3: Skill Assessment & Training Assignment
router.post('/:id/skills', async (req, res) => {
  try {
    const { skillTags, assessmentPassed, trainingCompleted, actor = 'TRAINING_ADMIN' } = req.body;
    const partner = await repo.getPartnerById(req.params.id);

    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });

    const beforeState = {
      skills: partner.skills,
      assessmentPassed: partner.assessmentPassed,
      trainingCompleted: partner.trainingCompleted
    };

    if (Array.isArray(skillTags)) {
      partner.skills = skillTags;
      partner.skillTags = skillTags;
    }
    if (typeof assessmentPassed === 'boolean') partner.assessmentPassed = assessmentPassed;
    if (typeof trainingCompleted === 'boolean') {
      partner.trainingCompleted = trainingCompleted;
      partner.trainingStatus = trainingCompleted ? 'COMPLETE' : 'INCOMPLETE';
    }

    // Recalculate score and tier
    const scoreResult = recalculateQualityScore(partner, { trainingCompleted: partner.trainingCompleted });
    partner.performanceScore = scoreResult.newScore;
    partner.tier = scoreResult.newTier;
    partner.commissionRate = scoreResult.commissionRate;

    // Check activation gate
    const gateResult = checkActivationGate(partner);
    partner.isActive = gateResult.isActive;
    partner.status = gateResult.status;

    const saved = await repo.savePartner(partner);

    logAction({
      actor,
      action: 'PARTNER_SKILLS_TRAINING_UPDATED',
      targetType: 'PARTNER',
      targetId: partner.id,
      before: beforeState,
      after: { skills: partner.skills, assessmentPassed: partner.assessmentPassed, trainingCompleted: partner.trainingCompleted, tier: partner.tier },
      reason: 'Updated skills, assessment results, and training status'
    });

    res.json({ success: true, data: saved, scoreResult, gateResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Module 1.4: Manual Activation Check
router.get('/:id/activation-status', async (req, res) => {
  try {
    const partner = await repo.getPartnerById(req.params.id);
    if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });

    const gateResult = checkActivationGate(partner);
    res.json({ success: true, partnerId: partner.id, gateResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
