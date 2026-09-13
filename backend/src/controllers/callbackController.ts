import { Request, Response, NextFunction } from 'express';
import { Callback } from '../models/Callback';

export const createCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, email, message } = req.body;

    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Name and phone number are required' });
      return;
    }

    const callback = await Callback.create({
      name,
      phone,
      email,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Callback request received. We will get back to you shortly!',
      data: callback,
    });
  } catch (error) {
    next(error);
  }
};

export const getCallbacks = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const callbacks = await Callback.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: callbacks.length, data: callbacks });
  } catch (error) {
    next(error);
  }
};

export const updateCallbackStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const callback = await Callback.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!callback) {
      res.status(404).json({ success: false, message: 'Callback request not found' });
      return;
    }

    res.status(200).json({ success: true, data: callback });
  } catch (error) {
    next(error);
  }
};
