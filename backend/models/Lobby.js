import mongoose from 'mongoose';
const lobbySchema = new mongoose.Schema(
    {
        code:{
            type: String, 
            required: true,
            unique: true
        },
        host:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        questionCount: {
            type: Number,
            required: true
        },
        difficulty: {
            type: String,
            required: true
        },
        visibility: {
            type: String,
            enum: ['Private', 'Public'],
            required: true
        },
        duration:{
            type: Number,
            required: true
        },
        topics:{
            type: [String],
                required: true
        },
        maxPlayers: {
            type: Number,
            default: 10
        },
        status:{
            type: String,
            enum : ['waiting','started','finished'],
            default: "waiting"
        },
        contestStartedAt: {
            type: Date,
            },

            contestEndsAt: {
            type: Date,
        },
        participants: [
            {
                type:   mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            ],
        questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
        },
        ],
        scores: {
            type: Map,
            of: Number,
            default: {}
        },
        solvedQuestions: {
            type: Map,
            of: [{
                question: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Question'
                },
                solvedAt: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: {}
        }
        },
        {
            timestamps: true
        }
);
const Lobby = mongoose.model('Lobby', lobbySchema);
export default Lobby;