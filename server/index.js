// server/index.js
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Bharat Pro Backend Server running on port ${PORT}`);
});
