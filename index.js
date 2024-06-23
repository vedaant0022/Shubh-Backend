
const express =require('express')
const mongoose = require('mongoose');
require('dotenv').config()
const cors = require('cors');
const UserOTP = require('./Models/UserOTP');
const multer  = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const Members = require('./Models/Members');
const { users } = require('moongose/models');
const User = require('./Models/User');
const GName = require('./Models/GName');
const Otp = require('./Models/UserOTP');
const AdminAuth = require('./Models/AdminAuth');


const dburl = process.env.MONGOURL;
mongoose.connect(dburl)
const app = express()
const port = 8000;
app.use(express.json())
app.use(cors())
app.use(express.static(path.resolve('./public')));


app.get('/',(req,res)=>{
    res.end("Server started")
})


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'anuragma807@gmail.com',
    pass: 'qdgcydiuuqieryny',
  },
});

// Includes Register, SendOTP, and Save Otp
app.post('/test', async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Register the new user
    const newUser = new User({ username, email, password, phoneNumber });
    await newUser.save();

    // Generate OTP
    const OTP = Math.floor(1000 + Math.random() * 9000).toString();
    const otpEntry = new Otp({ email, otp: OTP });
    await otpEntry.save();
    const mailOptions = {
      from: 'anuragma807@gmail.com',
      to: email,
      subject: 'Your OTP for authentication',
      text: `Your OTP is: ${OTP}`
    };

    // Send OTP via email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'User registered successfully and OTP sent.', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while registering the user or sending OTP.' });
  }
});
 
  // Login
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({email})
  
      if (!user) {
        return res.status(401).json({ error: 'User not registered', "status": "false" });
      }
  
      if (password === user.password) {
        res.status(200).json({ message: 'Authentication successful' ,"status":"ok", "email":email,"password":password});
      } else {
        res.status(401).json({ message: 'Please Enter correct Email or Password' , "status":"invalid"});
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


//  authenticate OTP
app.post('/authenticateOTP', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const userOTP = await UserOTP.findOne({  otp });

    if (!userOTP) {
      
      res.status(401).json({ message: 'Invalid OTPsssssss' });
    } else {
     
      res.status(200).json({ message: 'OTP authentication successful'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Profile picture upload
// 1. Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  console.log(req.body.file)
  res.status(200).json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path
  });
});

// Create group 
app.post('/creategroups', async (req, res) => {
  try {
    const { Gname, createdBy, photo } = req.body;

    const existingGroup = await GName.findOne({ Gname });
    if (existingGroup) {
      return res.status(400).json({ error: 'Group already exists', status: false });
    }

    const user = await User.findOne({ email: createdBy });
    if (!user) {
      return res.status(400).json({ error: 'Invalid user email' });
    }

    const newGroup = new GName({
      Gname,
      createdBy,
      photo,
      members: [createdBy] 
    });

    const savedGroup = await newGroup.save();
    user.groups.push(savedGroup._id);
    await user.save();
    res.status(201).json(savedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join an existing group
app.put('/join', async (req, res) => {
  try {
    const { _id, members } = req.body;
    const group = await GName.findOne({ _id });

    if (!group) {
      return res.status(404).json({ error: 'Group not found', status: false });
    }
    if (group.members.includes(members)) {
      return res.status(400).json({ error: 'Email already exists in the group', status: false });
    }
    group.members.push(members);
    const updatedGroup = await group.save();

    res.status(200).json(updatedGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Retrieve group based on email
app.get('/groups/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid user email' });
    }

    const groups = await GName.find({ members: email });

    if (!groups.length) {
      return res.status(404).json({ error: 'No groups found for this user' });
    }

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Dashboard API

app.get('/groups', async (req, res) => {
  try {
    const groups = await GName.find();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Create User
app.post('/admins', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const newAdmin = new AdminAuth({
      name,
      email,
      password
    });

    await newAdmin.save();
    res.status(201).json(newAdmin);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin Authentication
app.post('/Adminauth', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await AdminAuth.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Authentication successful', admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// All testing Demo API 
const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Gphoto/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload1 = multer({ storage: storage2 });


app.post('/testgroup', upload1.single('Gphoto'), async (req, res) => {
  try {
    const { Gname, createdBy, photo } = req.body;
    const Gphoto = req.file ? req.file.buffer : null;

    const existingGroup = await GName.findOne({ Gname });
    if (existingGroup) {
      return res.status(400).json({ error: 'Group already exists', status: false });
    }

    const user = await User.findOne({ email: createdBy });
    if (!user) {
      return res.status(400).json({ error: 'Invalid user email', status: false });
    }

    const newGroup = new GName({
      Gname,
      Gphoto,
      createdBy,
      photo: photo ? JSON.parse(photo) : [],
      members: [createdBy]
    });

    const savedGroup = await newGroup.save();

    user.groups.push(savedGroup._id);
    await user.save();

    res.status(201).json({ group: savedGroup, status: true });
  } catch (error) {
    res.status(500).json({ error: error.message, status: false });
  }
});

app.get('/test/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid user email' });
    }

    // Find groups where the user's email is in the members array
    const groups = await GName.find({ members: email });

    if (!groups.length) {
      return res.status(404).json({ error: 'No groups found for this user' });
    }

    // Prepare an array of group IDs to populate Gphoto field
    const groupIds = groups.map(group => group._id);

    // Populate the Gphoto field in each group document
    const populatedGroups = await GName.find({ _id: { $in: groupIds } }).populate('Gphoto').exec();

    res.status(200).json(populatedGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.listen(port,()=>{
    console.log("Working ", port)
})








































