import mongoose from "mongoose";

mongoose.connect("mongodb+srv://jainpriya7583_db_user:r7VRsluOzh3zUPEi@cluster0.ntkkbgo.mongodb.net/doctors?retryWrites=true&w=majority&appName=Cluster0")
.then(() => {
    console.log("Connected");
    process.exit();
})
.catch(err => {
    console.log(err);
});