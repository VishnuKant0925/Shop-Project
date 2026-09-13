import { model, Schema } from 'mongoose';

const RevokedTokenSchema = new Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
});

export const RevokedToken = model('RevokedToken', RevokedTokenSchema);
