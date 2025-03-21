const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    user_id:        { type: mongoose.Schema.Types.ObjectId,     required: true,     ref: 'User'         },     // Refer to User Schema
    community_name: { type: String,     required: true,                             ref: 'Community'    },     // Refer to Community Schema
    create_time:    { type: Date,       default: () => new Date() },
    upvotes:        { type: Number,     default: 0          },
    downvotes:      { type: Number,     default: 0          },
    upvotes_user:   { type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    downvotes_user: { type: [mongoose.Schema.Types.ObjectId], ref: 'User'},
    post_title:     { type: String,     required: true      },
    post_content:   { type: String,     required: true      },
    attachment:     { type: String,     required: false     }, // You can store the file path or URL here
    edited:         { type: Boolean,    default: false      }
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;