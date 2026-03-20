const { publishEvent } = require('../kafka/producer');

const publishDoubtCreated = (data) =>
  publishEvent('doubt-events', { event: 'doubt-created', timestamp: new Date().toISOString(), data });

const publishDoubtDeleted = (data) =>
  publishEvent('doubt-events', { event: 'doubt-deleted', timestamp: new Date().toISOString(), data });

const publishDoubtSolved = (data) =>
  publishEvent('doubt-events', { event: 'doubt-solved', timestamp: new Date().toISOString(), data });

const publishReplyAdded = (data) =>
  publishEvent('reply-events', { event: 'reply-added', timestamp: new Date().toISOString(), data });

const publishReplyDeleted = (data) =>
  publishEvent('reply-events', { event: 'reply-deleted', timestamp: new Date().toISOString(), data });

const publishAnswerAccepted = (data) =>
  publishEvent('reply-events', { event: 'answer-accepted', timestamp: new Date().toISOString(), data });

const publishReplyUpvoted = (data) =>
  publishEvent('vote-events', { event: 'reply-upvoted', timestamp: new Date().toISOString(), data });

const publishVoteRemoved = (data) =>
  publishEvent('vote-events', { event: 'vote-removed', timestamp: new Date().toISOString(), data });

module.exports = {
  publishDoubtCreated,
  publishDoubtDeleted,
  publishDoubtSolved,
  publishReplyAdded,
  publishReplyDeleted,
  publishAnswerAccepted,
  publishReplyUpvoted,
  publishVoteRemoved
};