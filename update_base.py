import re

with open('src/components/CustomerApkView.tsx', 'r') as f:
    content = f.read()

# 1. Update lucide-react imports if needed
if 'Play,' not in content:
    content = content.replace(
        '  Shield\n} from \'lucide-react\';',
        '  Shield,\n  Play,\n  Pause,\n  Volume2,\n  VolumeX,\n  HelpCircle,\n  Info,\n  Star\n} from \'lucide-react\';'
    )

# 2. Update getService definition
old_get_svc = '  const getService = (id: string) => SV.find(s => s.id === id) || SV[0];'
new_get_svc = '''  const getService = (id: string) => {
    const resolved = resolveCategoryId(id);
    return SV.find(s => s.id === resolved) || SV[0];
  };'''

if old_get_svc in content:
    content = content.replace(old_get_svc, new_get_svc)

# 3. Add new states
state_anchor = '  const [sliderKit, setSliderKit] = useState(50);'
new_states = '''  const [sliderKit, setSliderKit] = useState(50);
  const [sliderFloor, setSliderFloor] = useState(50);
  const [detailSlider, setDetailSlider] = useState(50);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'popular' | 'deep' | 'furniture' | 'specialized'>('all');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);'''

if state_anchor in content and 'drawerOpen' not in content:
    content = content.replace(state_anchor, new_states, 1)

# 4. Update filteredServices
old_filtered = '''  // Filtered Services for Search
  const filteredServices = SV.filter(s => 
    !searchFilter || s.n.toLowerCase().includes(searchFilter.toLowerCase())
  );'''

new_filtered = '''  // Filtered Services for Search & Category Tabs
  const filteredServices = SV.filter(s => {
    const matchesSearch = !searchFilter || 
      s.n.toLowerCase().includes(searchFilter.toLowerCase()) || 
      s.detail.tagline.toLowerCase().includes(searchFilter.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeCategoryFilter === 'popular') {
      return ['bathroom-cleaning', 'full-home-deep-cleaning', 'sofa-cleaning', 'kitchen-cleaning'].includes(s.id);
    }
    if (activeCategoryFilter === 'deep') {
      return ['full-home-deep-cleaning', 'bathroom-cleaning', 'kitchen-cleaning', 'move-in-cleaning', 'move-out-cleaning', 'floor-cleaning'].includes(s.id);
    }
    if (activeCategoryFilter === 'furniture') {
      return ['sofa-cleaning', 'carpet-cleaning', 'mattress-cleaning', 'room-cleaning'].includes(s.id);
    }
    if (activeCategoryFilter === 'specialized') {
      return ['water-tank-cleaning', 'appliance-cleaning', 'balcony-cleaning', 'window-cleaning', 'glass-cleaning', 'door-cleaning', 'special-cleaning', 'commercial-cleaning'].includes(s.id);
    }
    return true;
  });'''

if old_filtered in content:
    content = content.replace(old_filtered, new_filtered, 1)

with open('src/components/CustomerApkView.tsx', 'w') as f:
    f.write(content)

print('Base state and filter updates applied successfully!')
