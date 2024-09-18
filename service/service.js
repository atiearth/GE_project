import { collection, getDocs, query, where } from "firebase/firestore"

// Check length of Password
export const password_validate = async(password) => {
    const minLength = 8
    return password.length >= minLength
}

// Check email user & database of firebase
export const checkEmailExists = async (db, collect, email) => {
    try {
        const userRef = collection(db, collect)
        const q = query(userRef, where("Email", "==", email.toLowerCase())) // ensure lowercase comparison
        const querySnapshot = await getDocs(q)

        // Check if any documents match
        if (!querySnapshot.empty) {
            console.log("Email already exists in Firestore.")
            return true // email exists
        } else {
            console.log("Email is available.")
            return false // email does not exist
        }
    } catch (error) {
        console.log("Error checking email:", error)
        throw new Error("Unable to check email existence.")
    }
}

// Validate email
export const validateEmail = async(email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/
    return emailRegex.test(email)
}

export const generate_id = async (db, collect) => {
    //run id
    let data = []
    const querySnapshot = await getDocs(collection(db, collect))
    querySnapshot.forEach((doc) => data.push(doc.id))

    //check user in collection for run id
    let Id = null
    if (data.length == 0) {
        Id = '1'
    } else {
        Id = `${parseInt(data.slice(-1)) + 1}`
    }
    
    return Id
}