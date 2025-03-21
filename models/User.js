const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    user_name:  { type: String, required: true, default: "New User" },
    user_pfp:   { type: String, default: "/pictures/defaultprofile.jpg" }, // Default profile picture
    user_desc:  { type: String, default: "No description yet." },
    date_join:  { type: Date,
        default: () => new Date().setHours(0, 0, 0, 0) // Store only date
    },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true, minlength: 8 },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;