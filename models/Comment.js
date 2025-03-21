const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Foreign key reference to User
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, // Post
    parent_comment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null }, //Comment
    create_time: { type: Date, default: Date.now },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    upvotes_user:   { type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    downvotes_user: { type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    comment_content: { type: String, required: true },
    edited: { type: Boolean, default: false }
});


const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;
