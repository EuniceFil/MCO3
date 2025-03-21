// - Int community_id (pk)
// - Str community_name
// - Str community_desc
// - img community_pfp

const mongoose = require('mongoose')

const CommunitySchema = new mongoose.Schema({
    community_name: String,
    community_desc: String,
    community_pfp: String
});

const Community = mongoose.model('Community', CommunitySchema);

module.exports = Community;