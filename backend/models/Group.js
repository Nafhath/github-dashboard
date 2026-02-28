import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    repos: [{
        type: String,
        trim: true,
    }]
}, {
    timestamps: true
});

const Group = mongoose.model('Group', groupSchema);

export default Group;
