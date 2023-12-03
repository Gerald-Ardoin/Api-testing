// This file contains API endpoints for interacting with the "events" collection in the MongoDB database
const express = require('express');
const router = express.Router();

const org = process.env.ORG_ID;

// Middleware for authorization. For API calls that require authorization, this middleware checks if the header of API calls have a valid security token. If no security token or invalid security token, then the API call is not made.
const authMiddleWare = require('../auth/authMiddleWare');

// importing data model schemas
const { events, clients, services } = require('../models/models');

// API endpoint to get all events for org
router.get('/', authMiddleWare, (req, res, next) => {
  events
    .find({ org: org }, (error, data) => {
      if (error) {
        return next(error);
      } else {
        return res.json(data);
      }
    })
    // sort by date descending
    .sort({ date: -1 });
});

router.get('/details/id/:id', authMiddleWare, (req, res, next) => {
  const eventId = req.params.id;
  console.log('inside ');
  events.findById({ _id: eventId, org: org }, (error, event) => {
    if (error) {
      return next(error);
    } else {
      if (!event) {
        return res.status(400).send('Event not found.. Invalid event id');
      }

      const attendeeIds = event.attendees.map((attendee) =>
        attendee.toString()
      );

      clients.find({ _id: { $in: attendeeIds } }, (error, attendees) => {
        if (error) {
          return next(error);
        } else {
          services.find({ org: org }, (error, servics) => {
            if (error) {
              return next(error);
            } else {
              const responseData = {
                eventResponse: event,
                clientsResponse: attendees,
                servicesResponse: servics,
              };
              console.log('responseData: ', responseData);
              res.json(responseData);
            }
          });
        }
      });
    }
  });
});

// API endpoint to GET single event by ID
router.get('/id/:id', authMiddleWare, (req, res, next) => {
  events.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send('Event not found');
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events based on search query
// Ex: '...?name=Food&searchBy=name'
router.get('/search/', authMiddleWare, (req, res, next) => {
  const dbQuery = { org: org };
  switch (req.query.searchBy) {
    case 'name':
      dbQuery.name = { $regex: `${req.query.name}`, $options: 'i' };
      break;
    case 'date':
      dbQuery.date = req.query.eventDate;
      break;
    default:
      return res.status(400).send('invalid searchBy');
  }
  events.find(dbQuery, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events for which a client is signed up
router.get('/client/:id', authMiddleWare, (req, res, next) => {
  events.find({ attendees: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events for which a client is not signed up
router.get(
  '/client/:id/not-registered',
  authMiddleWare,
  async (req, res, next) => {
    try {
      const eventsNotRegistered = await events.find({
        attendees: { $nin: [req.params.id] },
        org: org,
      });
      res.json(eventsNotRegistered);
    } catch (error) {
      next(error);
    }
  }
);

// API endpoint to GET attendee details for an event
router.get('/attendees/:id', authMiddleWare, (req, res, next) => {
  events.findById(req.params.id, (error, event) => {
    if (error) {
      return next(error);
    } else {
      if (!event) res.status(400).send('Event not found');
      else {
        const attendeeIds = event.attendees.map((attendee) =>
          attendee.toString()
        );
        clients.find({ _id: { $in: attendeeIds } }, (error, clients) => {
          if (error) {
            return next(error);
          } else {
            res.json(clients);
          }
        });
      }
    }
  });
});

// API endpoint to GET all events for a given service
router.get('/service/:id', authMiddleWare, async (req, res, next) => {
  try {
    const eventsWithService = await events
      .find({ services: { $in: [req.params.id] }, org: org })
      .select({ _id: 1, name: 1, date: 1, address: { line1: 1 } })
      .lean();
    res.json(eventsWithService);
  } catch (error) {
    next(error);
  }
});

// API endpoint to POST new event
router.post('/', authMiddleWare, (req, res, next) => {
  const newEvent = req.body;
  newEvent.org = org;
  events.create(newEvent, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.status(200).send('New event created successfully');
    }
  });
});

// API endpoint to PUT -> update event
router.put('/update/:id', authMiddleWare, (req, res, next) => {
  events.findOneAndUpdate(
    { _id: req.params.id, org: org },
    req.body,
    (error, data) => {
      if (error) {
        return next(error);
      } else {
        res.status(200).send('Event updated successfully');
      }
    }
  );
});

// API endpoint to PUT -> add attendee to event
router.put('/register', authMiddleWare, (req, res, next) => {
  events.find(
    { _id: req.query.event, attendees: req.query.client, org: org },
    (error, data) => {
      if (error) {
        return next(error);
      } else {
        // only add attendee if not yet signed up
        if (!data.length) {
          events.findByIdAndUpdate(
            req.query.event,
            { $push: { attendees: req.query.client } },
            (error, data) => {
              if (error) {
                return next(error);
              } else {
                res.status(200).send('Client added to event');
              }
            }
          );
        } else {
          res.status(400).send('Client already added to event');
        }
      }
    }
  );
});

// API endpoint to PUT -> remove attendee from event
router.put('/deregister', authMiddleWare, (req, res, next) => {
  events.findByIdAndUpdate(
    req.query.event,
    { $pull: { attendees: req.query.client } },
    (error, data) => {
      if (error) {
        return next(error);
      } else {
        clients.findByIdAndUpdate(
          req.query.client,
          { $pull: { events: req.query.event } },
          (error, data) => {
            if (error) {
              return next(error);
            } else {
              res.send('Client deregistered with event');
            }
          }
        );
      }
    }
  );
});

// API endpoint to hard DELETE event by ID
router.delete('/:id', authMiddleWare, (req, res, next) => {
  events.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send('Event not found');
    } else {
      // only delete event if no clients are signed up
      if (data.attendees.length === 0) {
        events.findOneAndDelete(
          { _id: req.params.id, org: org },
          (error, data) => {
            if (error) {
              return next(error);
            } else if (!data) {
              res.status(400).send('Event not found');
            } else {
              res.status(200).send('Event deleted successfully');
            }
          }
        );
      } else {
        res.status(400).send("Event has attendees and can't be deleted.");
      }
    }
  });
});

// GET event attendance for the past two months for dashboard
router.get('/attendance', (req, res, next) => {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  events
    .find({ org: org, date: { $gte: twoMonthsAgo } }, (error, data) => {
      if (error) {
        return next(error);
      } else {
        res.json(data);
      }
    })
    .sort({ date: 1 });
});

module.exports = router;
