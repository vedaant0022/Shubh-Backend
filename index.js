
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
  // File uploaded successfully
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

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid user email' });
    }

    // Find the groups where the user is a member
    const groups = await GName.find({ members: email });

    if (!groups.length) {
      return res.status(404).json({ error: 'No groups found for this user' });
    }

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




app.listen(port,()=>{
    console.log("Working ", port)
})






















// app.post('/sendOTP', async (req, res) => {
//   try {
//     const { email } = req.body;
//     const OTP = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
//     const mailOptions = {
//       from: 'anuragma807@gmail.com',
//       to: email,
//       subject: 'Your OTP for authentication',
//       text: `Your OTP is: ${OTP}`
//     };
//     await transporter.sendMail(mailOptions);

//     // Assuming user information is stored in req.user after authentication
//     // Check if req.user is defined and contains user information
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     // Store the OTP in the database
//     const userOTP = new UserOTP({ user: req.user._id, OTP }); // Corrected req.User to req.user
//     await userOTP.save();

//     res.status(200).json({ message: 'OTP sent successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });







// Retrieve Groups
// app.get('/users/:id/groups', async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findById(userId).populate('groups');
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.status(200).json(user.groups);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


































//   //Login 

//   app.post('/login', async (req, res) => {
//     try {
//       const user = await Registration.findOne({ username: req.body.username.toLowerCase() });
  
//       if (!user || user.password !== req.body.password.toLowerCase()) {
//         return res.status(401).json({ message: 'Invalid username or password' });
//       }
//       res.json({ message: 'User authenticated successfully' });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   });


// app.post('/todos', async (req, res) => {
//     try {
//       const newTodo = new Todo(req.body);
//       const savedTodo = await newTodo.save();
//       res.status(201).json(savedTodo);
//     } catch (error) {
//       res.status(400).json({ message: error.message });
//     }
//   });
  
//   app.get('/todos', async (req, res) => {
//     try {
//       const todos = await Todo.find();
//       res.json(todos);
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   });

// app.delete('/todos/delete/:title', async (req, res) => {
//     try {
//       const result = await Todo.deleteOne({ id: req.params.id });
  
//       if (result.deletedCount === 0) {
//         res.status(404).json({ message: 'Todo not found' });
//       } else {
//         res.status(200).json({ message: 'Todo successfully deleted' });
//       }
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   });

// app.put('/todos/update/:title', async (req, res) => {
//     try {
//       const updatedTodo = await Todo.findOneAndUpdate(
//         { id: req.params.id }, 
//         req.body,
//         {
//           new: true, 
//           runValidators: true 
//         }
//       );
  
//       if (updatedTodo) {
//         res.json(updatedTodo);
//       } else {
//         res.status(404).json({ message: 'Todo with the given title not found' });
//       }
//     } catch (error) {
//       res.status(400).json({ message: error.message });
//     }
//   });
  
//   // Contact form
//   app.post('/contacts', async (req, res) => {
//     try {
//       const contact = new Contact(req.body);
//       await contact.save();
//       res.status(201).send(contact);
//     } catch (error) {
//       console.error('Error creating contact:', error.message);
//       res.status(400).send({ error: error.message });
//     }
//   });

//   // email
//   app.post('/emails', async (req, res) => {
//     try {
//       const email = new Emails(req.body);
//       await email.save();
//       res.status(201).send(email);
//     } catch (error) {
//       console.error('Error creating email entry:', error.message);
//       res.status(400).send({ error: error.message });
//     }
//   });