const imageRouter = require('express').Router();
const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Image = require('../models/Image');
const ImageOrder = require('../models/ImageOrder');

imageRouter.get('/', async (req, res) => {
  const images = await ImageOrder.findOne().populate('order', {
    url: 1,
    title: 1,
    type: 1,
    cloudinaryId: 1,
  });
  const imageOrder = images.order;
  res.json(imageOrder);
});

imageRouter.post('/', upload.array('file', 10), async (req, res) => {
  if (req.user === process.env.ADMIN_ID) {
    const imagesToUpload = req.files.map(
      async (file) => await cloudinary.uploader.upload(file.path)
    );
    const uploadedImages = await Promise.all(imagesToUpload);
    const images = uploadedImages.map(
      (image) =>
        new Image({
          title: req.body.title || 'placeholder text',
          url: image.secure_url,
          type: req.body.type,
          cloudinaryId: image.public_id,
          createdAt: new Date(),
        })
    );
    const imagesToBeSaved = images.map((image) => image.save());
    const savedImages = await Promise.all(imagesToBeSaved);
    const imageOrder = await ImageOrder.findOne();
    imageOrder.order.push(...savedImages);
    await imageOrder.save();
    res.status(201).json({
      success: true,
      message: 'Successfully uploaded',
      images: savedImages,
    });
  } else {
    res.status(401).json({ error: 'unauthorized user' });
  }
});

imageRouter.put('/', async (req, res) => {
  if (req.user === process.env.ADMIN_ID) {
    const updatedOrder = req.body;
    const ids = req.body.map((b) => b.id);
    const imageOrder = await ImageOrder.findOne();
    imageOrder.order = ids;
    await imageOrder.save();
    res.status(200).json(updatedOrder);
  } else {
    res.status(401).json({ error: 'unauthorized user' });
  }
});

imageRouter.put('/:id', async (req, res) => {
  if (req.user === process.env.ADMIN_ID) {
    const updatedImage = await Image.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    await updatedImage.save();
    res.status(200).json(updatedImage);
  } else {
    res.status(401).json({ error: 'unauthorized user' });
  }
});

imageRouter.delete('/:id', async (req, res) => {
  if (req.user === process.env.ADMIN_ID) {
    const image = await Image.findByIdAndRemove(req.params.id);
    await cloudinary.uploader.destroy(image.cloudinaryId);
    const imageOrder = await ImageOrder.findOne();
    const newOrder = imageOrder.order.filter(
      (id) => id.toString() !== req.params.id
    );
    imageOrder.order = newOrder;
    await imageOrder.save();
    res.status(204).end();
  } else {
    res.status(401).json({ error: 'unauthorized user' });
  }
});

module.exports = imageRouter;