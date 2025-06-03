import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../Schema/user.js';

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 15 * 24 * 60 * 60 * 1000,
}
// Register route
router.post('/register', async (req, res) => {
   if(!req.body || req.body === undefined){
    return res.status(400).json({ msg: "All fields are required. first condations" });
  }

   console.log('body data =========== ', req.body);
   
    const { name, email, password  } = req.body;
    let { profileImg } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ msg: "All fields are required." });
  }
   
  if (!profileImg || !profileImg.trim()) {
    profileImg = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`;
  } else {
    profileImg = profileImg.trim();
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name: name.trim(), email: email.trim(), password: hashedPassword , profileImg });
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15d' });

    res
      .cookie('token', token, COOKIE_OPTIONS)
      .json({ token, msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login route
router.post('/login', async (req, res) => {
  if(!req.body || req.body === undefined){
    return res.status(400).json({ msg: "Email and password are required." });
  }
 const { email, password } = req.body;

  console.log('data is =========== ', req.body);

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ msg: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials , user not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15d' });

    res
      .cookie('token', token, COOKIE_OPTIONS)
      .json({ token, success: true , user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
