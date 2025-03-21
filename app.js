const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

const app = express();
const hbs = require('hbs');

// mongoose connection
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/AnimoMeetDB')

/* For file uplods */
const fileUpload = require('express-fileupload')

/* Initialize our user */
const User = require('./models/User');

/* Initialize our post */
const Post = require("./models/Post")

/* Initialize our community */
const Community = require("./models/Community");

/* Initialize our comment */
const Comment = require("./models/Comment");

const path = require('path') // our path directory
app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static('public')) // we'll add a static directory named "public"
app.use(fileUpload()) // for fileuploads

/***********End export *******************/

// --- Session Implementation --- //

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
    })
);

app.use(cookieParser());

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

// --- Constant Declaration: Communities --- //

const communities = [
    {
        community_name: "Computer Studies",
        community_desc: "In a world of ever-evolving technology, we are the pioneers of the future! Home to the students under computer studies, we cater to students interested in learning the backends of the machines that make this modern world. Join our community for the latest tech talks, handy coding tips, competitive challenges, and more.",
        community_pfp: "/pictures/computerstudies.png"
    },
    {
        community_name: "Science",
        community_desc: "A space for all things science! Whether you're into biology, chemistry, physics, or any other field, this is the place to discuss discoveries, share insights, ask questions, and dive into the wonders of the natural world. From the latest research to mind-boggling facts, let's explore science together!",
        community_pfp: "/pictures/science.png"
    },
    {
        community_name: "Engineering",
        community_desc: "A community for aspiring and current engineers at DLSU. Whether you’re into mechanical, civil, electrical, or any other branch, this is the place to discuss projects, share resources, ask questions, and collaborate. Let’s work together to solve problems and push the boundaries of engineering.",
        community_pfp: "/pictures/engineering.jpg"
    },
    {
        community_name: "Liberal Arts",
        community_desc: "A place for DLSU students and anyone passionate about the humanities, arts, and social sciences. Whether you’re into literature, philosophy, sociology, or art history, this space is for exploring, discussing, and expanding your ideas. Let’s engage in meaningful conversations and broaden our understanding of the world through diverse perspectives.",
        community_pfp: "/pictures/liberalarts.jpg"
    },
    {
        community_name: "Business",
        community_desc: "For the aspiring entrepreneurs looking to make a profit, this one’s for you! This community is targeted towards people looking into a future in business. Managing finances, developing marketing strategies, generating revenue, and more, we got you covered. Join this community now to start reaching your business goals together!",
        community_pfp: "/pictures/business.jpg"
    },
    {
        community_name: "Economics",
        community_desc: "Join our community of economics enthusiasts, where we explore everything from global markets to real-world policies. Engage in thought-provoking discussions, learn from experts, and connect with like-minded individuals passionate about understanding the world of economics. Let’s dive into the dynamic world of economics, together!",
        community_pfp: "/pictures/economics.jpg"
    },
    {
        community_name: "Law",
        community_desc: "Join our community of law enthusiasts, where we explore legal theories, current events, and landmark cases. Engage in insightful discussions, learn from legal experts, and connect with others passionate about understanding the world of law. Let’s delve into the complexities of law, together!",
        community_pfp: "/pictures/law.png"
    },
    {
        community_name: "Education",
        community_desc: "“Education is the most powerful weapon which you can use to change the world.” —Nelson Mandela. Home to aspiring educators who seek to inspire others, the learning never stops there. Join our community now to share teaching tips on and new knowledge with one another!",
        community_pfp: "/pictures/education.png"
    }
];

// Insert communities into MongoDB only if they don’t already exist
async function initializeCommunities() {
    const count = await Community.countDocuments();
    if (count === 0) {
        await Community.insertMany(communities);
        console.log("Inserted default communities into MongoDB!");
    }
}

initializeCommunities();

// --- Community Page --- //

app.get("/community/:community_name", async (req, res) => {
    try {
        const user = req.session.user;
        // Find the community by its name
        const community = await Community.findOne({ community_name: req.params.community_name }).lean();

        if (!community) {
            return res.status(404).send("Community not found");
        }

        // Fetch posts in this community
        const posts = await Post.find({ community_name: community.community_name }) // Remove "a/"
            .populate("user_id", "user_name user_pfp")
            .sort({ create_time: -1 })
            .lean();

        // Get all post IDs
        const postIds = posts.map(post => post._id);

        let comments = [];
        if (postIds.length > 0) {
            // Fetch comments only if there are posts
            comments = await Comment.find({
                $or: [
                    { parent_id: { $in: postIds } }, // Comments under posts
                    { parent_comment_id: { $exists: true } } // Replies to comments
                ]
            })
                .populate("user_id", "user_name user_pfp")
                .sort({ create_time: 1 }) // Sort oldest first to maintain proper nesting
                .lean();
        }

        // Group comments into a parent-child structure
        let commentMap = {};
        comments.forEach(comment => {
            commentMap[comment._id] = { ...comment, comments: [] };
        });

        let rootComments = [];
        comments.forEach(comment => {
            if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
                // Attach to parent
                commentMap[comment.parent_comment_id].comments.push(commentMap[comment._id]);
            } else {
                // Root-level comments
                rootComments.push(commentMap[comment._id]);
            }
        });

        // Attach comments to respective posts
        posts.forEach(post => {
            post.comments = rootComments.filter(comment =>
                comment.parent_id?.toString() === post._id.toString()
            );
            post.community_name = community ? community.community_name : 'Unknown Community';
        });

        res.render("viewcommpage", { user, community, posts, communities });
    } catch (error) {
        console.error("Error fetching community:", error);
        res.status(500).send("Server error");
    }
});

// --- Home Page / Main Page Implementation --- //

app.get("/", async (req, res) => {
    try {
        const communities = await Community.find(); // Fetch all communities
        const user = req.session.user;

        // Fetch all posts
        const posts = await Post.find()
            .sort({ create_time: -1 })
            .populate("user_id", "user_name user_pfp") // Populate user details
            .lean();

        // Get all post IDs
        const postIds = posts.map(post => post._id);

        const comments = await Comment.find({
            $or: [
                { parent_id: { $in: postIds } }, // Comments under posts
                { parent_comment_id: { $exists: true } } // Replies to comments
            ]
        })
            .populate("user_id", "user_name user_pfp")
            .sort({ create_time: 1 }) // Oldest first for correct nesting
            .lean();

        // Group comments in a parent-child structure
        const commentMap = {};
        comments.forEach(comment => commentMap[comment._id] = { ...comment, comments: [] });

        let rootComments = [];
        comments.forEach(comment => {
            if (comment.parent_comment_id) {
                if (commentMap[comment.parent_comment_id]) {
                    commentMap[comment.parent_comment_id].comments.push(commentMap[comment._id]);
                }
            } else {
                rootComments.push(commentMap[comment._id]);
            }
        });

        // Attach comments to respective posts
        posts.forEach(post => {
            post.comments = rootComments.filter(comment => comment.parent_id.toString() === post._id.toString());

            const cleanCommunityName = post.community_name?.replace(/^a\//, "");
            const community = communities.find(comm => comm.community_name === cleanCommunityName);
            post.community_name = community ? community.community_name : 'Unknown Community';
        });

        res.render("main/mainpage", { user, posts, communities });

    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send("Server Error");
    }
});

// --- Login Implementation --- //

app.get("/login", (req, res) => {
    if (req.session.user) {
        res.redirect("/profile");
    }
    else{
        res.render("loginpage");
    }
});

app.post("/login", express.urlencoded({ extended: true }), async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }); // Find user in MongoDB
        if (!user) {
            return res.render("loginpage", { error: "Invalid credentials. Please try again." });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            req.session.user = {
                user_name: user.user_name,   // Change 'name' -> 'user_name' to match schema
                user_pfp: user.user_pfp,     // Store profile picture
                user_desc: user.user_desc,   // Store user description
                date_join: user.date_join,   // Store join date
                email: user.email,           // Store email (optional if needed in session)
                userID: user._id             // Keep user ID
            };
            res.cookie("sessionId", req.sessionID);
            res.redirect("/profile");
        } else {
            res.render("loginpage", { error: "Invalid credentials. Please try again." });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).send("Error logging in.");
    }
});

// --- Register Implementation --- //

app.get("/register", (req, res) => {
    if (req.session.user) {
        res.redirect("/profile");
    }
    else{
        res.render("registerpage");
    }
});

app.post("/register", express.urlencoded({ extended: true }), async (req, res) => {
    const { agreement, email, password, confirmPassword } = req.body;

    try {
        // Check if passwords match
        if (password !== confirmPassword) {
            return res.render("registerpage", { error: "Passwords do not match." });
        }

        // Check if checkbox is ticked
        if (agreement !== "true") {  // Checking user input (string)
            return res.render("registerpage", { error: "You must accept the terms and conditions." });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const newUser = new User({ email, password: hashedPassword});
        await newUser.save(); // Saves to the database

        req.session.user = {
            user_name: newUser.user_name,   // Change 'name' -> 'user_name' to match schema
            user_pfp: newUser.user_pfp,     // Store profile picture
            user_desc: newUser.user_desc,   // Store user description
            date_join: newUser.date_join,   // Store join date
            email: newUser.email,           // Store email (optional if needed in session)
            userID: newUser._id             // Keep user ID
        };

        res.redirect("/profile");
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).send("Error registering user.");
    }
});

// --- View own profile --- //

app.get("/profile", isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user; // Get logged-in user info
        const communities = await Community.find().lean(); // Fetch communities

        // Fetch ONLY posts made by the logged-in user
        const posts = await Post.find({ user_id: user.userID })
            .sort({ create_time: -1 }) // Sort by newest first
            .populate('user_id', 'user_name user_pfp')
            .lean();

        // Fetch ONLY comments made by the logged-in user
        const userComments = await Comment.find({ user_id: user.userID })
            .sort({ create_time: -1 }) // Sort by newest first
            .populate('user_id', 'user_name user_pfp')
            .lean();

        // Render the profile page with only the user's posts and comments
        res.render("viewprofilepage", { user, posts, comments: userComments, communities });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// --- Edit Profile Page --- //

app.get("/profile/edit", isAuthenticated, async (req, res) => {
    try {
        const communities = await Community.find();
        res.render("editprofilepage", { user: req.session.user, communities });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// --- Profile Update Implementation --- //

app.post("/profile/update", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Unauthorized: Please log in.");
        }
        const userId = req.session.user.userID; // Ensure you get the logged-in user's ID
        const { user_name, user_desc } = req.body;
        let profilePicture;

        // Handle file upload if a new picture is provided
        if (req.files && req.files.profilePicture) {
            let file = req.files.profilePicture;
            let fileName = `${userId}${path.extname(file.name)}`;
            let uploadPath = path.join(__dirname, "public/pictures", fileName);

            await file.mv(uploadPath); // Move file to 'public/pictures'
            profilePicture = `/pictures/${fileName}`;
        }

        // Update user data
        const updateData = { user_name: user_name, user_desc };
        if (profilePicture) updateData.user_pfp = profilePicture;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

        // Update session with new data
        req.session.user.user_name = updatedUser.user_name;
        req.session.user.user_desc = updatedUser.user_desc;
        if (profilePicture) req.session.user.user_pfp = updatedUser.user_pfp;

        res.redirect("/profile"); // Redirect to updated profile
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating profile");
    }
});

// --- View profile of other user --- //

app.get("/profile/:user_id", async (req, res) => {
    try {
        const communities = await Community.find();
        const loggedInUser = req.session.user || null;
        const userId = req.params.user_id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send("Invalid user ID");
        }

        const userProfile = await User.findById(userId).lean();
        if (!userProfile) return res.status(404).send("User not found");

        // Fetch posts made by the user
        const posts = await Post.find({user_id: userId})
            .populate("user_id", "user_name user_pfp")
            .lean();

        // Get all post IDs
        const postIds = posts.map(post => post._id);

        // Fetch all comments under the user's posts
        const comments = await Comment.find({parent_id: {$in: postIds}})
            .populate("user_id", "user_name user_pfp")
            .sort({create_time: -1})
            .lean();

        // Structure comments in a nested format
        const commentMap = {};
        comments.forEach(comment => {
            commentMap[comment._id] = {...comment, replies: []};
        });

        let rootComments = [];
        comments.forEach(comment => {
            if (comment.parent_comment_id) {
                commentMap[comment.parent_comment_id]?.replies.push(commentMap[comment._id]);
            } else {
                rootComments.push(commentMap[comment._id]);
            }
        });

        // Attach nested comments to their respective posts
        posts.forEach(post => {
            const community = communities.find(community => community.community_id === post.community_id);
            post.community_name = community ? community.community_name : 'Unknown Community';
            post.comments = rootComments.filter(comment => comment.parent_id.toString() === post._id.toString());
        });

        // Fetch all comments made by the user (not just on their own posts)
        const userComments = await Comment.find({user_id: userId})
            .populate('user_id', 'user_name user_pfp')
            .sort({ create_time: -1 })
            .lean();

        console.log("User Comments:", userComments);


        res.render("viewotherprofile", {
            user: loggedInUser,
            userProfile,
            posts,
            communities,
            comments: userComments, // Comments *made by the user*
            isOwnProfile: loggedInUser ? loggedInUser.userID.toString() === userId.toString() : false
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// --- Logout Implementation --- //

app.get("/logout", (req, res) => {
    // Destroy the session and redirect to the login page
    req.session.destroy(() => {
        res.clearCookie("sessionId");
        res.redirect("/");
    });
});

// --- Trending Page Implementation --- //

app.get("/trending", async (req, res) => {
    try {
        const user = req.session.user;
        const communities = await Community.find().lean(); // Fetch all communities

        const trendingPosts = await Post.find()
            .sort({upvotes: -1}) // Sort by upvotes
            .populate("user_id", "user_name user_pfp") // Populate user details
            .lean();

        const postIds = trendingPosts.map(post => post._id);

        const comments = await Comment.find({
            $or: [
                { parent_id: { $in: postIds } }, // Comments under posts
                { parent_comment_id: { $exists: true } } // Replies to comments
            ]
        })
            .populate("user_id", "user_name user_pfp") // Populate comment user details
            .sort({ create_time: 1 }) // Oldest first for proper nesting
            .lean();

        // Organize comments into a parent-child structure
        const commentMap = {};
        comments.forEach(comment => {
            commentMap[comment._id] = { ...comment, comments: [] }; // Use "comments" for consistency
        });

        let rootComments = [];
        comments.forEach(comment => {
            if (comment.parent_comment_id) {
                // Nest replies under their parent comments
                commentMap[comment.parent_comment_id]?.comments.push(commentMap[comment._id]);
            } else {
                rootComments.push(commentMap[comment._id]);
            }
        });

        // Attach formatted time, comments, and community names to posts
        trendingPosts.forEach(post => {
            post.comments = rootComments.filter(comment => comment.parent_id.toString() === post._id.toString());

            // Ensure correct community name
            const cleanCommunityName = post.community_name?.replace(/^a\//, "");
            const community = communities.find(comm => comm.community_name === cleanCommunityName);
            post.community_name = community ? community.community_name : 'Unknown Community';
        });

        res.render("trendingpage", { user, posts: trendingPosts, communities }); // Pass posts to the template
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching trending posts");
    }
});

// --- Explore Page Implementation --- //

app.get("/explore", async (req, res) => {
    try {
        const user = req.session.user;
        const communities = await Community.find(); // Fetch communities
        res.render("explorepage", { user, communities });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});


// --- Create Post Page --- //

app.get('/create-post', isAuthenticated, function (req, res) {
    const user = req.session.user;
    console.log(user);
    res.render('createpostpage', {user, communities });
});

// --- Submit Post Implementation --- //

app.post('/submit-post', isAuthenticated, async function(req, res) {
    const user = req.session.user;
    const communities = await Community.find();
    console.log(req.files)
    if (req.files) {
        const { image } = req.files; // Access the uploaded file
        const fileName = `${Date.now()}${path.extname(image.name)}`; // Generate a unique file name
        const uploadPath = path.resolve(__dirname, 'public/pictures', fileName);

        try { // Has an image upload
            await image.mv(uploadPath);
            const imageUrl = `/pictures/${fileName}`;
            const { community, title, content } = req.body;

            if (!title) {
                return res.render("createpostpage", { error: "Title of the post cannot be empty.", user, communities });
            }
            if (!content) {
                return res.render("createpostpage", { error: "Content of the post cannot be empty.", user, communities });
            }

            // Create post in db
            const newPost = new Post({
                user_id: user.userID,
                community_name: community,
                post_title: title,
                post_content: content,
                attachment: imageUrl
            });

            // Save the post to the database
            await newPost.save();

            // Render the view-post page with the new post data
            console.log(newPost);
            res.redirect(`/view-post/${newPost._id}?status=success&message=Post created successfully`);

        } catch (error) {
            console.error("Error uploading file or creating post:", error);
            res.status(500).send("Error uploading file or creating post.");
        }
    } else { // no image upload
        const { community, title, content } = req.body;
        console.log("no image uploaded");
        if (!title) {
            return res.render("createpostpage", { error: "Title of the post cannot be empty.", user, communities });
        }
        if (!content) {
            return res.render("createpostpage", { error: "Content of the post cannot be empty.", user, communities });
        }

        // Create post in db
        const newPost = new Post({
            user_id: user.userID,
            community_name: community,
            post_title: title,
            post_content: content
        });
        
        await newPost.save();

        // Render the view-post page with the new post data
        console.log(newPost);
        res.redirect(`/view-post/${newPost._id}?status=success&message=Post created successfully`);

    }
});

// --- Submit Comment Implementation --- //

app.post('/submit-comment', isAuthenticated, async function(req, res) {
    const user = req.session.user;
    const parentId = req.body.parent_id;  // Get the parent post ID
    const commentText = req.body.textbox;

    if (commentText) {                      // checks if there is content upon commenting. does nothing if null
        const ref_post = await Post.findOne({_id:parentId})
        if (ref_post) {                 // if parent is a post
            try {
                const newComment = new Comment({
                    user_id: user.userID,
                    parent_id: ref_post,
                    comment_content: commentText
                });
                await newComment.save();
        
                res.redirect(`/view-comment/${newComment._id}`);
            } catch (error) {
                console.error("Error posting comment:", error);
                res.status(500).send("Error posting comment.");
            }
        } else {
            const ref_comment = await Comment.findOne({_id:parentId})
            if (ref_comment) {          // if parent is a comment
                try {
                    const newComment = new Comment({
                        user_id: user.userID,
                        parent_comment_id: ref_comment,
                        comment_content: commentText
                    });
                    await newComment.save();
            
                    res.redirect(`/view-comment/${newComment._id}`);
                } catch (error) {
                    console.error("Error posting comment:", error);
                    res.status(500).send("Error posting comment.");
                }
            }
        }        
    }
});

// --- View post based on (post) id param --- //

app.get('/view-post/:id', isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user;                          // Get logged-in user info
        const communities = await Community.find().lean();      // Fetch communities
        const post = await Post.findById(req.params.id)         // Find post by param id
        const post_user = await User.findById(post.user_id)     // Find user that created post

        if (!post) {                                            // Check if post exists
            return res.status(404).send('Post not found.');     // Handle post not found (show error page)
        }

        // Fetch top-level comments (directly under the post)
        const directComments = await Comment.find({ parent_id: post._id })
            .populate("user_id", "user_name user_pfp")
            .sort({ create_time: 1 })
            .lean();

        // Recursively fetch nested comments
        for (let comment of directComments) {
            comment.comments = await nestedComments(comment._id);
        }

        const isOwner = user.userID.toString() === post.user_id.toString();

        res.render("viewpostpage", { user, post, post_user, comments: directComments, communities, isOwner});

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// --- View Comment Page --- //

app.get("/view-comment/:id", isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user;
        const communities = await Community.find().lean();

        // Fetch the main comment being viewed
        const comment = await Comment.findById(req.params.id).lean();
        if (!comment) {
            return res.status(404).send("Comment not found.");
        }

        const comment_user = await User.findById(comment.user_id).lean();

        // Fetch direct replies (first level)
        const directComments = await Comment.find({ parent_comment_id: comment._id })
            .populate("user_id", "user_name user_pfp")
            .sort({ create_time: 1 })
            .lean();

        // Recursively fetch all nested replies
        for (let comment of directComments) {
            comment.comments = await nestedComments(comment._id);
        }

        // Attach replies to the main comment
        comment.comments = directComments;

        const isOwner = user.userID.toString() === comment.user_id.toString();

        res.render("viewcommentpage", {user, comment_user, comment, communities, isOwner
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


// --- Edit Comment Page --- //

app.get("/edit-comment/:id", isAuthenticated, async(req, res) => {
    try {
        const user = req.session.user; // Get logged-in user info
        const communities = await Community.find().lean(); // Fetch communities
        const comment = await Comment.findById(req.params.id).lean(); // Find the post

        if (!comment) {
            return res.status(404).send("Comment not found.");
        }

        // Render edit page only if authorized
        res.render("editcommentpage", { user, comment, communities });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// --- Edit Post Page --- //

app.get("/edit-post/:id", isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user; // Get logged-in user info
        const communities = await Community.find().lean(); // Fetch communities
        const post = await Post.findById(req.params.id).lean(); // Find the post

        if (!post) {
            return res.status(404).send("Post not found.");
        }

        // Render edit page only if authorized
        res.render("editpostpage", { user, post, communities });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// --- Post Update Implementation --- //

app.post("/post/update/:id", isAuthenticated, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        const userId = req.session.user.userID;
        const postId = req.params.id;
        const { title, content, community } = req.body;
        let postImage;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send("Post not found.");
        }

        if (post.user_id.toString() !== userId.toString()) {        // Ensure only the post owner can update it
            return res.status(403).send("Unauthorized: You cannot edit this post.");
        }

        if (req.files && req.files.image) {                         // Handle file upload (if a new image is provided)
            let file = req.files.image;
            let fileName = `${postId}${path.extname(file.name)}`;
            let uploadPath = path.join(__dirname, "public/pictures", fileName);

            await file.mv(uploadPath);                              // Move file to 'public/pictures'
            postImage = `/pictures/${fileName}`;

            if (post.image) {                                       // Delete old image if it exists
                let oldImagePath = path.join(__dirname, "public", post.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);                    // Remove old image
                }
            }
        }

        const updateData = {                                        // Update post data
            post_title: title,
            post_content: content,
            community_name: community,
            edited: true
        };
        if (postImage) updateData.attachment = postImage;

        await Post.findByIdAndUpdate(postId, updateData, { new: true });

        res.redirect(`/view-post/${postId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating post.");
    }
});

// --- Delete post Implementation --- //

app.post("/post/delete/:id", isAuthenticated, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        const userId = req.session.user.userID;
        const postId = req.params.id;

        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send("Post not found.");
        }

        // Ensure only the post owner can delete it
        if (post.user_id.toString() !== userId.toString()) {
            return res.status(403).send("Unauthorized: You cannot delete this post.");
        }

        // Delete post image if it exists
        if (post.image) {
            let oldImagePath = path.join(__dirname, "public", post.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath); // Remove old image
            }
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);

        res.redirect("/"); // Redirect to main after deletion
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting post.");
    }
});

// --- Comment Update Implementation --- //

app.post("/comment/update/:id", isAuthenticated, async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send("Unauthorized: Please log in.");
        }

        const userId = req.session.user.userID;
        const commentId = req.params.id;
        const {content} = req.body;
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).send("comment not found.");
        }

        if (comment.user_id.toString() !== userId.toString()) {        // Ensure only the post owner can update it
            return res.status(403).send("Unauthorized: You cannot edit this comment.");
        }

        const updateData = {                                        // Update post data
            comment_content: content,
            edited: true
        };

        await Comment.findByIdAndUpdate(commentId, updateData, { new: true });

        res.redirect(`/view-comment/${commentId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating post.");
    }
});

// --- Post Vote Implementation --- //

app.post('/postvote/:id', isAuthenticated, async function(req, res) {
    const user = req.session.user;          // session user
    const value = req.body.vote;            // 1 = upv, -1 downv
    const this_post = await Post.findById(req.params.id);
    
    if (!this_post.upvotes_user) {
        this_post.upvotes_user = []; // Initialize it as an empty array if not already
    }
    if (!this_post.downvotes_user) {
        this_post.downvotes_user = []; // Initialize it as an empty array if not already
    }
  
    // Check if the user voted
    const userUpvote = this_post.upvotes_user.find(vote => vote.toString() === user.userID.toString());
    const userDownvote = this_post.downvotes_user.find(vote => vote.toString() === user.userID.toString());
  
    if (userUpvote) {
      if (value === "1") {
        this_post.upvotes -= 1;
        this_post.upvotes_user.pull(user.userID); // Remove user from upvotes_user
        console.log(this_post.upvotes_user);
        console.log("Removed Upvote");
      } else if (value === "-1") {
        this_post.upvotes -= 1;
        this_post.downvotes += 1;
        this_post.upvotes_user.pull(user.userID); // Remove user from upvotes_user
        this_post.downvotes_user.push(user.userID); // Add user to downvotes_user
        console.log("Downvoted");
      }
    } else if (userDownvote) {
      if (value === "-1") {
        this_post.downvotes -= 1;
        this_post.downvotes_user.pull(user.userID); // Remove user from downvotes_user
        console.log("Removed Downvote");
      } else if (value === "1") {
        this_post.downvotes -= 1;
        this_post.upvotes += 1;
        this_post.downvotes_user.pull(user.userID); // Remove user from downvotes_user
        this_post.upvotes_user.push(user.userID); // Add user to upvotes_user
        console.log("Upvoted");
      }
    } else {
      if (value === "1") {
        this_post.upvotes += 1;
        this_post.upvotes_user.push(user.userID); // Add user to upvotes_user
        console.log("Upvoted:", this_post.upvotes_user);  // Log the updated array
        console.log("Upvoted");
      } else if (value === "-1") {
        this_post.downvotes += 1;
        this_post.downvotes_user.push(user.userID); // Add user to downvotes_user
        console.log("Downvoted");
      }
    }
  
    // Save the post after updates
    await this_post.save();
  
    res.redirect(`/view-post/${this_post._id}`);
});

// --- Comment Vote Implementation --- //

app.post('/commentvote/:id', isAuthenticated, async function(req, res) {
    const user = req.session.user;          // session user
    const value = req.body.vote;            // 1 = upv, -1 downv
    const this_comment = await Comment.findById(req.params.id);
    
    if (!this_comment.upvotes_user) {
        this_comment.upvotes_user = []; // Initialize it as an empty array if not already
    }
    if (!this_comment.downvotes_user) {
        this_comment.downvotes_user = []; // Initialize it as an empty array if not already
    }
  
    // Check if the user voted
    const userUpvote = this_comment.upvotes_user.find(vote => vote.toString() === user.userID.toString());
    const userDownvote = this_comment.downvotes_user.find(vote => vote.toString() === user.userID.toString());
  
    if (userUpvote) {
      if (value === "1") {
        this_comment.upvotes -= 1;
        this_comment.upvotes_user.pull(user.userID); // Remove user from upvotes_user
        console.log(this_comment.upvotes_user);
        console.log("Removed Upvote");
      } else if (value === "-1") {
        this_comment.upvotes -= 1;
        this_comment.downvotes += 1;
        this_comment.upvotes_user.pull(user.userID); // Remove user from upvotes_user
        this_comment.downvotes_user.push(user.userID); // Add user to downvotes_user
        console.log("Downvoted");
      }
    } else if (userDownvote) {
      if (value === "-1") {
        this_comment.downvotes -= 1;
        this_comment.downvotes_user.pull(user.userID); // Remove user from downvotes_user
        console.log("Removed Downvote");
      } else if (value === "1") {
        this_comment.downvotes -= 1;
        this_comment.upvotes += 1;
        this_comment.downvotes_user.pull(user.userID); // Remove user from downvotes_user
        this_comment.upvotes_user.push(user.userID); // Add user to upvotes_user
        console.log("Upvoted");
      }
    } else {
      if (value === "1") {
        this_comment.upvotes += 1;
        this_comment.upvotes_user.push(user.userID); // Add user to upvotes_user
        console.log("Upvoted:", this_comment.upvotes_user);  // Log the updated array
        console.log("Upvoted");
      } else if (value === "-1") {
        this_comment.downvotes += 1;
        this_comment.downvotes_user.push(user.userID); // Add user to downvotes_user
        console.log("Downvoted");
      }
    }
  
    // Save the comment after updates
    await this_comment.save();
  
    res.redirect(`/view-comment/${this_comment._id}`);
});

// --- Search Page --- //

app.get("/search", async (req, res) => {
    try {
        const query = req.query.searchQuery;
        if (!query) {
            return res.render("searchpage", { posts: [], query });
        }

        // Search for posts where title or content contains the query (case-insensitive)
        const posts = await Post.find({
            $or: [
                { post_title: { $regex: query, $options: "i" } },
                { post_content: { $regex: query, $options: "i" } }
            ]
        })
            .populate("user_id", "user_name user_pfp _id")
            .lean();

        const communities = await Community.find().lean();
        const user = req.session.user;

        res.render("searchpage", { user, posts, query, communities });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send("Server error");
    }
});

// --- Helper for nested comments --- //

async function nestedComments(parentCommentId) {
    const comments = await Comment.find({ parent_comment_id: parentCommentId })
        .populate("user_id", "user_name user_pfp")
        .sort({ create_time: 1 }) // Oldest first
        .lean();

    // Recursively fetch replies for each reply
    for (let comment of comments) {
        comment.comments = await nestedComments(comment._id);
    }

    return comments;
}

// --- timeFormat Helper --- //

hbs.registerHelper("timeFormat", function (timestamp) {
    if (!timestamp) return "N/A"; // Handle null timestamps

    const now = new Date();
    const diffMs = now - new Date(timestamp); // Difference in milliseconds
    const diffSec = Math.floor(diffMs / 1000); // Convert to seconds

    if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? "s" : ""} ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 365) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;

    const diffYear = Math.floor(diffDay / 365);
    return `${diffYear} year${diffYear !== 1 ? "s" : ""} ago`;
});

// Register formatDate helper
hbs.registerHelper("formatDate", function (date) {
    if (!date) return "N/A"; // Handle cases where date might be null
    return new Date(date).toISOString().split("T")[0]; // Returns YYYY-MM-DD
});

hbs.registerPartials(__dirname + "/views/partials");
app.set('view engine','hbs');

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});