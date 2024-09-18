import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc, collection, getDocs, updateDoc, query, where, deleteDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import multer from "multer"
import express from "express"
import { generate_id, password_validate, checkEmailExists, validateEmail } from "../service/service.js"

const firebaseConfig = {
    apiKey: "AIzaSyBCWyUDqPDMi9bF1dCyAR-B8PSq1kwWTic",
    authDomain: "geproject-ad1e8.firebaseapp.com",
    databaseURL: "https://geproject-ad1e8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "geproject-ad1e8",
    storageBucket: "geproject-ad1e8.appspot.com",
    messagingSenderId: "576519914198",
    appId: "1:576519914198:web:4ea22b9e940295f7ca7f77",
    measurementId: "G-T71MMWHC5C"
  }

const router = express.Router()
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const storage = getStorage(app)
const upload = multer({ storage: multer.memoryStorage() })

let user_login = null

//home page
router.get("/", async (req, res) => {
    try {
        //check login of user for show home page
        let posts = []
        const postSnapshot = await getDocs(collection(db, "posts"))
        if (user_login != null) {
            postSnapshot.forEach((doc) => {
                let post_temp = doc.data()
                if (post_temp.Like.includes(user_login.User_Id)) {
                    post_temp["like_status"] = "like"
                } else {
                    post_temp["like_status"] = "unlike"
                }
                posts.push(post_temp)
            })
            return res.status(200).render("homepage_login", {posts: posts})
        } else {
            postSnapshot.forEach((doc) => posts.push(doc.data()))
            return res.status(200).render("homepage", {posts: posts})
        }
    } catch (err) {
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show profile of user
router.get("/user/profile", async (req, res) => {
    try {
        return res.status(200).render("profile", {user: user_login})
    } catch (err) { 
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show login page
router.get("/user/login", async (req, res) => {
    try {
        return res.status(200).render("loginForm")
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//login user
router.post("/user/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase()

        // Find user from database
        const userQuery = query(collection(db, "users"), where("Email", "==", normalizedEmail))
        const userSnapshot = await getDocs(userQuery)

        // Check user from database
        if (userSnapshot.empty) {
            return res.redirect(`/user/login?error=${encodeURIComponent("Email not found")}`)
        }

        let userData;
        userSnapshot.forEach(doc => {
            userData = doc.data();
        })

        // Check password
        if (userData.Password !== password) { // Compare plaintext passwords (not recommended)
            return res.redirect(`/user/login?error=${encodeURIComponent("Incorrect password")}`)
        }

        user_login = userData
        return res.status(200).redirect("/")
    } catch (err) {
        console.log(err)
        return res.redirect(`/user/login?error=${encodeURIComponent(err.message)}`)
    }
})

//logout user
router.get("/user/logout", async (req, res) => {
    try {
        user_login = null
        return res.status(200).redirect("/")
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show register page
router.get("/user/form", async (req, res) => {
    try {
        return res.status(200).render("registerForm")
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//create User
router.post("/user/save", async (req, res) => {
    try {
        const { firstname, lastname, email, password, confirm_password } = req.body

        // Validate email format
        if (!validateEmail(email)) {
            return res.redirect(`/user/form?error=Invalid email format.`);
        }

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase()

        // Check if email already exists in the database
        const emailExists = await checkEmailExists(db, "users", normalizedEmail)
        if (emailExists) {
            return res.redirect(`/user/form?error=Email already exists.`)
        }

        // Check if passwords match
        if (password !== confirm_password) {
            return res.redirect(`/user/form?error=Passwords do not match.`)
        }

        // Check length of password
        const isPasswordValid = await password_validate(password);
        if (!isPasswordValid) {
            return res.redirect(`/user/form?error=Passwords must be more than 8 characters.`)
        }

        // Generate a new user ID and save the user
        const userId = await generate_id(db, "users")
        await setDoc(doc(db, "users", userId), {
            User_Id: userId,
            First_Name: firstname,
            Last_Name: lastname,
            Email: normalizedEmail,
            Password: password
        })

        console.log("User added!");
        return res.redirect('/user/login')
    } catch (err) {
        console.log(err)
        return res.redirect(`/user/form?error=${encodeURIComponent(err.message)}`)
    }
})

//show edit page
router.get("/user/edit", async (req, res) => {
    try {
        return res.status(200).render("editProfile", {user: user_login})
    } catch (err) {
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//edit user
router.post("/user/edit", async (req, res) => {
    try {
        // Get values from the edit form
        const { firstname, lastname, email, password, confirm_password } = req.body;
        
        // Validate email format
        if (!validateEmail(email)) {
            return res.redirect(`/user/edit?error=Invalid email format.`);
        }

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Check if email exists in database (and make sure it’s not the current user’s email)
        if (normalizedEmail !== user_login.Email) {
            const emailExists = await checkEmailExists(db, "users", normalizedEmail);
            if (emailExists) {
                return res.redirect(`/user/edit?error=Email already exists.`);
            }
        }

        // Check if passwords match
        if (password !== confirm_password) {
            return res.redirect(`/user/edit?error=Passwords do not match.`);
        }

        // Check password length
        const isPasswordValid = await password_validate(password);
        if (!isPasswordValid) {
            return res.redirect(`/user/edit?error=Password must be more than 8 characters.`);
        }

        // Update user data
        await updateDoc(doc(db, "users", `${user_login.User_Id}`), {
            First_Name: firstname,
            Last_Name: lastname,
            Email: normalizedEmail,
            Password: password
        });

        // Update session data with the new user data
        user_login = { ...user_login, First_Name: firstname, Last_Name: lastname, Email: normalizedEmail, Password: password };

        console.log("User edited!");
        return res.redirect("/user/profile");
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show recipe of user at login
router.get("/user/recipe", async (req, res) => {
    try {
        let post_user = []
        const querySnapshot = await getDocs(collection(db, "posts"))
        querySnapshot.forEach((doc) => {
            if (user_login.User_Id == doc.data().User_Id) {
                post_user.push(doc.data())
            }
        })
        return res.status(200).render("myRecipe", {posts: post_user})
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show only one post for view detail of post
router.get("/post/view/:postId", async (req, res) => {
    
    try {
        const post_id = req.params.postId
        let post = []
        const postQuery = await getDocs(collection(db, "posts"))
        postQuery.forEach((doc) => {
            if (doc.data().Post_Id == post_id) {
                post.push(doc.data())
            }
        })
        if (user_login == null) {
            return res.status(200).render("viewRecipe", {post : post});
        } else {
            return res.status(200).render("viewRecipe_login", {post: post})
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show post page for add recipes
router.get("/post/form", async (req, res) => {
    try {
        return res.status(200).render("postrecipeForm")
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//create post of user
router.post("/post/save", upload.single("image"), async (req, res) => {
    try {
        //Get image from request
        const image = req.file

        if (!image) {
            return res.status(400).json({
                RespCode: 400,
                RespMessage: "No file uploaded"
            })
        }

        //Create a reference to the image in Firebase Storage
        const imageName = `${Date.now()}_${image.originalname}`
        const imageRef = ref(storage, `uploads/${imageName}`)

        //Upload image to Firebase Storage
        await uploadBytes(imageRef, image.buffer)

        //Get the download URL for the uploaded image
        const publicUrl = await getDownloadURL(imageRef)

        const { header, ingredients, how_to } = await req.body

        const postId = await generate_id(db, "posts")
        await setDoc(doc(db, "posts", postId), {
            Post_Id: postId,
            User_Id: user_login.User_Id,
            Header: header,
            Image: publicUrl,
            Ingredients: ingredients,
            How_To: how_to,
            Like: [],
            Create_At: new Date(),
            Update_At: new Date()
        })

        console.log("User post recipe success!")
        return res.redirect("/")
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//relationship of like
router.post('/post/like/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        // Update like count in database
        let posts = []
        const postQuery = await getDocs(query(collection(db, "posts"), where("Post_Id", "==", postId)))
        postQuery.forEach((doc) => posts.push(doc.data()))

        let Like = null
        let message = null
        //check user like to post
        if (posts[0].Like.indexOf(user_login.User_Id) == -1) {
            //list of list have this user
            Like = [...posts[0].Like, user_login.User_Id]
            await updateDoc(doc(db, "posts", postId), {
                Like: Like
            })
            message = 'Like'
        } else {
            //list of like don't have this user
            Like = posts[0].Like.filter(item => item !== user_login.User_Id)
            await updateDoc(doc(db, "posts", postId), {
                Like: Like
            })
            message = 'Unlike'
        }

        console.log(`${message} from user id : ${user_login.User_Id} successful!!`)
        return res.status(201).json({ likes: Like.length, like_status: message.toLowerCase()})
    } catch (err) {
        console.error(err);
        res.status(500).json({ RespMessage: 'Internal Server Error' });
    }
})

//show edit form of post
router.get("/post/edit/:post_id", async (req, res) => {
    try {
        //get data post from database
        const post_id = req.params.post_id
        const post = []
        const postQuery = await getDocs(collection(db, "posts"))
        postQuery.forEach((doc) => {
            if (post_id == doc.data().Post_Id) {
                post.push(doc.data())
            }
        })
        return res.status(200).render("editRecipe", {post: post[0]})
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//edit post and update date time
router.post("/post/edit/:post_id", async (req, res) => {
    try {

        //update data of post
        const post_id = req.params.post_id
        const { header, ingredients, how_to } = req.body

        await updateDoc(doc(db, "posts", post_id), {
            Header: header,
            Ingredients: ingredients,
            How_To: how_to,
            Update_At: new Date()
        })

        console.log(`Edit post ID : ${post_id} successfully!!`)
        return res.status(201).redirect("/user/recipe")
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//delete post by id
router.delete("/post/delete/:postId", async (req, res) => {
    try {
        //get id of post from rapameter
        const post_id = req.params.postId

        //get image path from post
        let imagePath = null
        const postSnapshot = await getDocs(collection(db, "posts"))
        postSnapshot.forEach((doc) => {
            if (doc.data().Post_Id == post_id) {
                imagePath = doc.data().Image
            }
        })

        //delete data of post
        await deleteDoc(doc(db, "posts", post_id))
        await deleteObject(ref(storage, imagePath))

        console.log(`Post with ID : ${user_login.User_Id} has been deleted successfully!!`)
        return res.status(201).json({
            RespCode: 201,
            RespMessage: "Post deleted successfully"
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show about page
router.get("/about", async (req, res) => {
    try {
        if (user_login == null) {
            return res.status(200).render("about")
        } else {
            return res.status(200).render("about_login")
        }
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: err.message
        })
    }
})

//show error for paths that have never been seen
router.use("/", async (req, res) => {
    return res.status(404).send("<h1>404 Page not found!<h1>")
})


export default router