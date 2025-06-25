const express = require('express');
const { Pool } = require('pg'); 
const bcrypt = require('bcrypt');
const multer = require('multer');
const session = require('express-session');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const pool = new Pool({
    user: 'postgres',   
    host: 'db.imavuestpnbirljecgal.supabase.co',   
    database: 'postgres', 
    password: 'Deepak@2113', 
    port: 5432,          
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'student-portal', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  
}));

app.use(express.static(path.join(__dirname, 'public')));
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const rollNo = req.body.id; 
        const lastFourDigits = rollNo.slice(-4);
        cb(null, `${lastFourDigits}.jpeg`);
    }
});
const upload = multer({ storage: storage });

app.post('/upload-profile-pic', upload.single('profile-pic'), (req, res) => {
    const rollNo = req.body.id;

    if (!rollNo) {
        return res.status(400).json({ success: false, message: 'Roll number (id) is required' });
    }

    if (typeof rollNo !== 'string' || rollNo.trim() === '') {
        return res.status(400).json({ success: false, message: 'Invalid roll number' });
    }

    const lastFourDigits = rollNo.slice(-4); // Get last 4 digits of roll number
    const imagePath = `uploads/${lastFourDigits}.jpeg`;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No profile picture uploaded' });
    }

    const query = 'UPDATE students SET profile_pic = $1 WHERE id = $2';
    pool.query(query, [imagePath, rollNo], (err, result) => {
        if (err) {
            console.error('Error updating profile picture:', err);
            return res.status(500).json({ success: false, message: 'Failed to update profile picture.' });
        }
        res.json({ success: true, message: 'Profile picture updated successfully!' });
    });
});

app.post('/update-attendance-manual', (req, res) => {
    const { db_present, db_absent, ai_present, ai_absent, cn_present, cn_absent, os_present, os_absent, cp_present, cp_absent } = req.body;
    const userId = req.user.id; 

    db.query('UPDATE attendance SET db_present = ?, db_absent = ?, ai_present = ?, ai_absent = ?, cn_present = ?, cn_absent = ?, os_present = ?, os_absent = ?, cp_present = ?, cp_absent = ? WHERE student_id = ?', 
        [db_present, db_absent, ai_present, ai_absent, cn_present, cn_absent, os_present, os_absent, cp_present, cp_absent, userId], 
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to update attendance' });
            }

            res.json({ message: 'Attendance updated successfully' });
        });
});
app.post('/update-profile', async (req, res) => {
    const { user_id, full_name, last_name, email, sub_section } = req.body;

    if (!user_id || !full_name || !last_name || !email || !sub_section) {
        return res.status(400).json({ success: false, message: 'Missing fields in request' });
    }

    try {
        const result = await pool.query(
        `UPDATE students
        SET full_name = $1, last_name = $2, email = $3, sub_section = $4
        WHERE id = $5`,
        [full_name, last_name, email, sub_section, user_id]
        );

        console.log('Rows updated:', result.rowCount);

        if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'No record found to update' });
        }
        return res.json({ success: true, message: 'Profile updated successfully' });
            
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/cgpa', async(req, res) => {
    if (req.session.username) {
        const userId = req.session.username;
        try{
            const result = await pool.query(
                'SELECT sgpa_sem1, sgpa_sem2, sgpa_sem3, sgpa_sem4, cgpa FROM students WHERE username = $1', [userId]
            );
            if (result.rows.length > 0) {
                const user = result.rows[0];
                res.json(user); 
            }
            else {
                res.status(404).send('User not found');
            }
        } catch (error) {
            console.error('Error fetching cgpa:', error);
            res.status(500).send('An error occurred while fetching the profile');
        }
    } else {
        // If the user is not logged in
        res.status(401).send('User not authenticated');
    }
});

//             console.error('Error fetching profile:', error);
//             res.status(500).send('An error occurred while fetching the profile');
//         }
//         else {
//         // If the user is not logged in
//         res.status(401).send('User not authenticated');
//     }
//         }
    
//     }
//     // const result = await pool.query(
//     //     'SELECT username, full_name, email, last_name, sub_section, profile_pic FROM students WHERE username = $1',
//     //     [username]
//     // );
//     // db.query('SELECT cgpa_sem1, cgpa_sem2, sgpa FROM students WHERE id = ?', [userId], (err, results) => {
//     //     if (err) {
//     //         console.error(err);
//     //         return res.status(500).json({ error: 'Database error' });
//     //     }
//     //     console.log(results);
//     //     const cgpaData = results[0]; 

//     //     if (!cgpaData) {
//     //         return res.status(404).json({ error: 'No CGPA data found' });
//     //     }

//     //     res.json({
//     //         cgpa_sem1: cgpaData.cgpa_sem1,
//     //         cgpa_sem2: cgpaData.cgpa_sem2,
//     //         sgpa: cgpaData.sgpa
//     //     });
//     // });
// });
// if (req.session.username) {
//     const username = req.session.username;

//     try {
//         // Query the database to get user profile info
//         const result = await pool.query(
//             'SELECT username, full_name, email, last_name, sub_section, profile_pic FROM students WHERE username = $1',
//             [username]
//         );

//         if (result.rows.length > 0) {
//             const user = result.rows[0];
//             res.json(user);  // Send user data back as JSON
//         }

//     }}
// Login Route (authenticate with plain-text password)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query the database to find the user by username
        const result = await pool.query('SELECT * FROM students WHERE username = $1', [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log(user);
            // Compare plain-text password (NO hashing)
            if (user.password === password) {
                // Store the username in session
                req.session.username = username; 
                // If passwords match, login is successful
                res.send('Login successful!');
            } else {
                // If password doesn't match, send an error
                res.send('Invalid credentials');
            }
        } else {
            // If user not found, send an error
            res.send('User not found');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('An error occurred');
    }
});

// Register Route (create new user with hashed password)
app.post('/register', async (req, res) => {
    const { id, full_name, last_name, username, password, email, branch, sub_section } = req.body;

    try {
        
        const result = await pool.query(
            `INSERT INTO students (id, full_name, last_name, username, password, email, branch_name, sub_section) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [id, full_name, last_name, username, password, email, branch, sub_section]
        );

        res.send('Registration successful!');
    } catch (error) {
        console.error('Error registering user:', error);
        console.error('Error code is : ',error.code);
        if(error.constraint === "students_pkey"){
            res.send('User already exist with this roll no!');
            // document.getElementById('message').textContent = 'A user already exist with this roll no.'; 
        }
        else if(error.constraint === "students_username_key"){
            res.send('Username already exist !!!')
        }
        // else if(error.code === "23505" && error.length === 197){
        //     res.send('This username already exist!!!');   constraint: 'students_pkey',  constraint: 'students_username_key',
        //   constraint: 'students_email_key', }
        else{
            res.send(error);
        }
        
    }
});

app.get('/profile', async (req, res) => {
    if (req.session.username) {
        const username = req.session.username;

        try {
            // Query the database to get user profile info
            const result = await pool.query(
                'SELECT username, full_name, email, last_name, sub_section, profile_pic FROM students WHERE username = $1',
                [username]
            );

            if (result.rows.length > 0) {
                const user = result.rows[0];
                res.json(user);  
            } else {
                res.status(404).send('User not found');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            res.status(500).send('An error occurred while fetching the profile');
        }
    } else {
        // If the user is not logged in
        res.status(401).send('User not authenticated');
    }
});

// Route to handle logout (destroy session)
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Failed to log out');
    }
    // Redirect to login page after session destroyed
    res.redirect('/login');
  });
});


// Middleware to protect routes (for profile and attendance)
app.use((req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login'); // Redirect to login if not authenticated
    }
    next(); // Proceed to the next middleware if authenticated
});

// Route to get attendance data for a user, with attendance per subject
app.get('/attendance', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('Unauthorized: No username in session');
    }

    const { username } = req.session;  // Get the username from session

    try {
        // Query to fetch attendance data from the database for all subjects
        const result = await pool.query(`
            SELECT 
                cn_present_class, cn_absent_class, 
                db_present_class, db_absent_class, 
                os_present_class, os_absent_class, 
                ai_present_class, ai_absent_class, 
                cp_present_class, cp_absent_class  
            FROM students
            WHERE username = $1
        `, [username]);

        if (result.rows.length > 0) {
            const data = result.rows[0];
            res.json(data);  // Send the attendance data back as JSON
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).send('An error occurred while fetching the attendance data');
    }
});
// Route to handle marking attendance (present or absent)
app.post('/mark-attendance', async (req, res) => {
    if (!req.session.username) {
        return res.status(401).send('Unauthorized: No username in session');
    }

    const { username } = req.session;
    const { subject, status } = req.body;  // Get subject and status (present/absent)

    try {
        let columnPrefix;
        if (subject === 'Computer Networks') columnPrefix = 'cn';
        else if (subject === 'Database Management Systems') columnPrefix = 'dp';
        else if (subject === 'Operating System') columnPrefix = 'os';
        else if (subject === 'Artificial Intelligence & Soft Computing') columnPrefix = 'ai';
        else if (subject === 'Competitive Programming') columnPrefix = 'cp';

        if (!columnPrefix) {
            return res.status(400).send('Invalid subject');
        }

        // Update attendance based on the status (present/absent)
        const presentColumn = `${columnPrefix}_present_class`;
        const absentColumn = `${columnPrefix}_absent_class`;
        const totalColumn = `${columnPrefix}_total_class`;

        const query = `
            UPDATE students
            SET 
                ${status === 'present' ? presentColumn : absentColumn} = ${status === 'present' ? presentColumn : absentColumn} + 1,
                ${totalColumn} = ${totalColumn} + 1
            WHERE username = $1
        `;
        
        await pool.query(query, [username]);
        
        res.json({ message: `Attendance for ${subject} marked as ${status}` });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).send('An error occurred while marking attendance');
    }
});
app.get('/get-username', (req, res) => {
    // Check if the user is authenticated and if their username exists in session
    if (req.session && req.session.username) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'User not logged in' });
    }
});
app.post('/update-attendance', async (req, res) => {
    const { username, subject, status } = req.body;

    try {
        // Map subject to the correct column name in the database
        const subjectMap = {
            cn: 'cn',
            db: 'db',
            os: 'os',
            ai: 'ai',
            cp: 'cp'
        };

        const subjectColumn = subjectMap[subject];

        // Update attendance (increment present or absent count)
        if (status === 'present') {
            await pool.query(`
                UPDATE students SET ${subjectColumn}_present_class = ${subjectColumn}_present_class + 1
                WHERE username = $1
            `, [username]);
        } else if (status === 'absent') {
            await pool.query(`
                UPDATE students SET ${subjectColumn}_absent_class = ${subjectColumn}_absent_class + 1
                WHERE username = $1
            `, [username]);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.json({ success: false });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
