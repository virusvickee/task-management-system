import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async createGuest(name?: string) {
    const guestName = name?.trim() || `Guest-${Date.now().toString().slice(-5)}`;
    return this.userModel.create({ name: guestName, isGuest: true });
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async updateProfile(id: string, dto: any) {
    return this.userModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
  }
}
