Allen V. Chavez
Aiella Reigne D. Evangelista
Eunice Marble R. Filipino
Isha Daphne E. Zulueta
CCAPDEV S16 Machine Project 2

// --- Instructions for compiling and running the program: --- //
1. Download the .zip file and extract it.
2. Open the command prompt to the file path of where you have extracted the folder to, within the folder with "app.js".
3. Enter "node app.js" on the command prompt. This is the controller of the web app.
4. Run your browser and enter "localhost:3000" on the search bar.

// --- Implemented features --- //
The program at its submission allows the user to perform the following actions:
- Login User
- Register User
- View Home Page
- View Trending Page
- View Profile
- View Posts within Profile
- View Comments within Profile
- Edit (own) Profile
- Create Posts
- View Posts
- Create Comments
- View Comments
- Edit (own) Posts
- Delete (own) Posts
- Edit (own) Comments
- Upvote/Downvote Posts
- Upvote/Downvote Comments
- Explore Communities
- View Posts in a specific community (View community page)
- Search posts
- Logout User

// --- Feature Descriptions --- //

1. Starting Interface
Upon loading the localhost server, the user will be directed to the home page, where they can access the home page, trending page and explore communities page from the side panel. Each community can also be viewed and accessed from the side panel. They will also be able to view a post's user, and search for a post. However, when attempting to create a post or comment, or when trying to upvote or downvote, they will be directed to the login page.

2. Logging User for Session
In the login page, the user can choose to either login by entering an existing email account in the database along with its corresponding password to create their session. A user may also choose to register a new profile with a unique email and a password to create a user.

3. Profile Features
After logging in or registering, they will be directed to their own user page. There, they can view their own profile, which includes their username, profile picture, join date, and bio, along with the list of posts and comments they created with the buttons found under their bio. They will gain the same access to the features on the side panel, and will also be able to create a post through the create post button in the header. They may also choose to edit their own profile through the edit button on the profile page. When editing their profile, they can choose to edit one of the following: profile picture, username, or bio. Save changes once done. The user can return to their profile page at any time within the session by hovering over the top right profile picture image and selecting "profile". They can also access their profile by clicking on their own username on one of their posts. The profile of others are displayed in the same manner, but they will not be able to edit their profile unless it is their own.

3. Post Features
When creating a post, a user must enter a title and content for the post, and select a community (if not the default option). Attaching an image is applicable but not required. When submitting, the post will be stored into the local database, and the users will be brought to the "view post" interface of the post they have just created. The user may choose to edit their post with new information for the fields through this interface, or delete the post entirely.

4. Comment Features
Comments are visible after pressing the "comments" button under a post. Comments are also automatically visible in the "view post" interface as well. A user may also comment on a post or another comment by entering their comment and pressing "submit", which will take them to the "view comment" interface upon success. A user may choose to edit their own comment through this interface.

5. Main, Trending, Explore and Community Pages.
The main page shows all posts according to recent post time. The trending page shows all posts according to upvotes. The explore page shows all communities. Depending on the community you choose to explore, you will be directed to the community page which displays all the posts within the community.

6. Accessible from Posts/Comments on Pages with Posts (User, View Post, Communities, Comments, Upvotes and Downvotes)
A user can view the creator of a post or comment by pressing on the username of the post's creator. They may view the post in a larger view, along with the comments of the post, by clicking on either the time created or the title of the post. Likewise, they may view the comments of the post by pressing the comments button, its creator by clicking the username, and in a larger view through the time created or content of the comment. Clicking on the community of the post will direct the user to the community page. A user may also upvote or downvote a post or comment. If they have already voted on a post and chose the same option, they will remove that vote. If they vote on another option, they will remove the previous vote and enter the new one. 

7. Search Posts
At any point while within the application (excluding login/register pages), a user can search for a post by entering a keyword from either post title or post content. The search will return posts that contain the keyword entered.

8. Logging Out User
When a user is done, they may log out from the logout option when hovering over the top right profile picture image. After logging out, the user's session will be destroyed and be redirected to the home page, where it all began.

// --- Database Models --- //
User: Database storing the users of the web app
Post: Database storing the posts of the web app
Community: Database storing the communities of the web app
	Note: All communities used in the web application are declared as constants instantiated in the controller file, app.js
Comment: Database storing the comments of the web app