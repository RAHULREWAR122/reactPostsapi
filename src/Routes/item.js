import express from 'express';
import auth from '../middleware/authMiddleware.js';
import Item from '../Schema/item.js';
import User from '../Schema/user.js';

const router = express.Router();


router.post('/', auth, async (req, res) => {
  try {
    const { title, description, img, visibility } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ msg: 'Title and description are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const item = new Item({
      title: title.trim(),
      description: description.trim(),
      img: img || '',
      visibility: visibility || 'private',
      userId: req.user.id,
      creatorName: user.name,
      creatorImg: user.profileImg || '' // assuming profileImg exists
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error('Error creating item:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get Items (Public or Own Private)
router.get('/allItems', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    const filter = {
      $or: [
        { visibility: 'public' },
        { userId: req.user.id }
      ]
    };

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('userId', 'name profileImg');

    const totalCount = await Item.countDocuments(filter);

    res.json({
      items,
      currentPage: page,
      totalPages: Math.ceil(totalCount / perPage),
      totalItems: totalCount
    });
  } catch (err) {
    console.error('Error fetching items:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});


// Add a comment to an item
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ msg: 'Comment text is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    const newComment = {
      userId: req.user.id,
      userName: user.name,
      userImg: user.profileImg || '',
      text: text.trim(),
      createdAt: new Date()
    };

    item.comments.push(newComment);
    await item.save();

    res.status(201).json({ msg: 'Comment added', comments: item.comments });
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update Item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    console.error('Error updating item:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete Item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    await item.deleteOne();
    res.json({ msg: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete a comment
router.delete('/:itemId/comment/:commentId', auth, async (req, res) => {
  try {
    const { itemId, commentId } = req.params;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ msg: 'Item not found' });

    const comment = item.comments.id(commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized to delete this comment' });
    }

    comment.remove();
    await item.save();

    res.json({ msg: 'Comment deleted', comments: item.comments });
  } catch (err) {
    console.error('Error deleting comment:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});


export default router;
