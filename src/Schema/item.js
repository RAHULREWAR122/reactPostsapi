import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userImg: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const ItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  img: String,
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private',
  },
  ratings: [Number], 
  creatorName: String,
  creatorImg: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [CommentSchema]
}, { timestamps: true });

export default mongoose.model('Item', ItemSchema);
