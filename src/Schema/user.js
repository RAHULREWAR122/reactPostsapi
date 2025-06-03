import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name:{type : String , require : true},
  email: { type: String, unique: true },
  password: {type : String , require : true},
  profileImg : {type : String , default :''}
});

export default mongoose.model('User', UserSchema);
