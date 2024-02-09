const express = require('express')
const app = express()
const { User, AllEvents, Registers } = require('./models')

const bodyParser = require('body-parser')
const csrf = require('tiny-csrf')

const passport = require('passport')
const connectEnsureLogin = require('connect-ensure-login')
const session = require('express-session')
const LoacalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const saltRounds = 10

const cookieParser = require('cookie-parser')
app.use(bodyParser.json())
app.set('views', './views')
const path = require('path')
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser('shh! some secret string'))
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']))

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
  secret: 'my_super_secret_key_123456789',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24hrs
  }
}))

app.use(passport.initialize())
app.use(passport.session())
let flag = 0
passport.use(new LoacalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username, password, done) => {
  console.log(username)
  User.findOne({
    where: {
      email: username
    }
  }).then(async (user) => {
    const result = await bcrypt.compare(password, user.password)
    if (result) {
      return done(null, user)
    } else {
      return done('Invalid Password')
    }
  }).catch((err) => {
    return (err)
  })
}))

passport.serializeUser((user, done) => {
  console.log('Serilalizing user in session', user.id)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user)
    }).catch(err => {
      done(err, null)
    })
})
app.get('/loginpage', (request, response) => {
  response.render('loginpage', { title: 'Login Page', csrfToken: request.csrfToken() })
})

app.get('/signuppage', (request, response) => {
  response.render('signuppage', { title: 'signup page', csrfToken: request.csrfToken() })
})

app.post('/signupsubmit', async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    })
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect('/loginpage')
    })
  } catch (err) {
    console.log(err)
  }
})

app.post('/loginsubmit', passport.authenticate('local', { failureRedirect: '/loginpage' }), (request, response) => {
  if (request.user.email === 'raji@gmail.com') {
    flag = 1
  } else {
    flag = 0
  }
  response.redirect('/dashboard')
})

app.get('/dashboard', (request, response) => {
  response.render('dashboard', { name: request.user.firstName, flag })
})

app.get('/addEvent', (request, response) => {
  response.render('addevent', { title: 'addEvent', csrfToken: request.csrfToken(), flag })
})

app.post('/uploadEvent', async (request, response) => {
  try {
    await AllEvents.create({
      eventImg: request.body.EventImg,
      eventTitle: request.body.EventTitle,
      eventDesc: request.body.content,
      eventVenue: request.body.EventLocation,
      eventCapacity: request.body.EventMemebers,
      eventStartDate: request.body.EventStartDate,
      eventTime: request.body.EventTime,
      eventEndDate: request.body.EventEndDate
    })
    // request.login(event, (err) => {
    //   if (err) {
    //     console.log(err)
    //   }
    response.redirect('/addEvent')
    // })
  } catch (err) {
    console.log(err)
  }
})

app.get('/allEvents', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  try {
    const EventData = await AllEvents.findAll()
    const FormattedEventData = EventData.map(EventData => ({
      id: EventData.id,
      UserId: EventData.eventUserId,
      eventImg: EventData.eventImg,
      eventTitle: EventData.eventTitle,
      eventDesc: EventData.eventDesc,
      eventVenue: EventData.eventVenue,
      eventCapacity: EventData.eventCapacity,
      eventStartDate: EventData.eventStartDate,
      eventTime: EventData.eventTime,
      eventEndDate: EventData.eventEndDate,
      createdAt: EventData.createdAt,
      updatedAt: EventData.updatedAt
    }))
    response.render('allEvents', { title: 'AllEvents', name: request.user.firstName, FormattedEventData, csrfToken: request.csrfToken(), flag })
  } catch (error) {
    console.error('Error fetching todos:', error)
    return response.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/viewEvent', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  try {
    const eventId = request.query.eventId
    console.log(eventId)
    const eventCont = await AllEvents.findOne({ where: { id: eventId } }
    )
    let a = 0
    const req = request.user.id

    await Registers.findOne({ where: { eventId, userId: req } })
      .then((result) => {
        if (result) {
          a = 1
        }
      })
      .catch((error) => {
        console.error('Error occurred while querying database:', error)
      })
    let arr = []
    arr = await Registers.findAll({ where: { eventId } })
    let val = 0
    const enddate = new Date(eventCont.eventEndDate)
    if (enddate < new Date() || arr.length >= eventCont.eventCapacity) {
      val = 1
    }
    response.render('viewEvent', { eventCont, eventId, flag, val, a, req })
  } catch (err) {
    console.log(err)
  }
})

app.get('/deleteEvent', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const eventId = request.query.eventId
  try {
    await AllEvents.destroy({
      where: {
        id: eventId
      }
    })
    response.redirect('/allEvents')
  } catch (err) {
    console.log(err)
  }
})

app.get('/myEvents', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  try {
    // Step 1: Extract all the rows {id, userId, eventId} from Registers table
    const currentUserId = request.user.id
    const data = await Registers.findAll({
      attributes: ['id', 'userId', 'eventId'],
      where: {
        userId: currentUserId
      }
    })

    // Step 2: Extract all the eventId from "data"
    const eventIdArray = data.map(entry => entry.eventId)

    // Step 3: Extract all the details of the events from allEvents table
    const formattedData = []

    for (let i = 0; i < eventIdArray.length; i++) {
      const eventDetails = await AllEvents.findOne({
        where: {
          id: eventIdArray[i]
        }
      })
      formattedData.push(eventDetails)
    }

    // Render the "myEvents.ejs" file passing formattedData object
    response.render('myEvents', { formattedData, name: request.user.firstName, flag })
  } catch (error) {
    console.error('Error retrieving data:', error)
    response.status(500).send('Internal Server Error')
  }
})

app.get('/viewRegisters', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  try {
    // Step 1: Extract all the rows {id, userId, eventId} from Registers table
    const eventId = request.query.eventId
    const data = await Registers.findAll({
      attributes: ['id', 'userId', 'eventId']
    })

    const temp = []
    for (let i = 0; i < data.length; i++) {
      if (data[i].eventId == eventId) {
        temp.push(data[i])
      }
    }

    // Step 2: Extract all the eventId from "data"
    const userIdArray = temp.map(entry => entry.userId)

    // Step 3: Extract all the details of the events from allEvents table
    const formattedData = []

    for (let i = 0; i < userIdArray.length; i++) {
      const userDetails = await User.findOne({
        where: {
          id: userIdArray[i]
        }
      })
      formattedData.push(userDetails)
    }
    console.log(formattedData)
    // Render the "myEvents.ejs" file passing formattedData object
    response.render('viewRegisters', { formattedData, name: request.user.firstName, flag })
  } catch (error) {
    console.error('Error retrieving data:', error)
    response.status(500).send('Internal Server Error')
  }
})

app.get('/registerEvent', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const ev = request.query.eventId
  try {
    await Registers.create({
      userId: request.user.id,
      eventId: ev

    })
    response.redirect('/myEvents')
  } catch (err) {
    console.log(err)
  }
})
app.get('/unRegister', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const ev = request.query.eventId
  try {
    await Registers.destroy({
      where: {
        userId: request.user.id,
        eventId: ev
      }
    })
    response.redirect('/myEvents')
  } catch (err) {
    console.log(err)
  }
})

app.listen(4040)
