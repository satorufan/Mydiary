const bcrypt = require("bcrypt")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const session = require("express-session")
const express = require("express")
const ObjectId = require("mongodb").ObjectId
var ls = require("local-storage")


var router = require("express").Router()

router.use(express.static("./views"))
router.use(session({secret:"scr", resave: true, saveUninitialized: false}))
router.use(passport.initialize())
router.use(passport.session())
passport.serializeUser((user, done)=>{
    console.log("serialize")
    done(null, user.id)
})
passport.deserializeUser(async (id, done)=>{
    console.log("deserialize")
    try {
        const user = await col.findOne({id: id})
        return done(null, user)
    } catch (e) {
        console.error(e)
        return done(e)
    }
})

passport.use(new LocalStrategy({
    usernameField: "id",
    passwordField: "pw",
    session: true,
}, async (input_id, input_pw, done)=>{
        const user = await col.findOne({id: input_id})
        if (!user) {
            return done(null, false, {message: "존재하지 않는 사용자입니다."})
        }
        const result = await bcrypt.compare(input_pw, user.pw_hash)
        if (result) {
            return done(null, user, {message: "로그인 성공"})
        }
        return done(null, false, {message: "비밀번호가 틀립니다."})
    })
)



router.get("/", (req, res)=>{
    ls("currentPage", 1)
    ls("currentPageFive", 0)
    res.render("index.ejs")
})

router.get("/login", (req, res)=>{
    ls("currentPage", 1)
    ls("currentPageFive", 0)
    res.render("login.ejs")
})

router.get("/register", (req, res)=>{
    res.render("register.ejs")
})

function loginCheck(req, res, next){
    if (req.user){
        next()
    } else {
        res.redirect("/diary/login")
    }
}
router.get("/mypage", loginCheck, (req, res)=>{
    res.render("mypage.ejs", {userSession: req.user})
})

router.get("/main", loginCheck, async (req, res)=>{
    const post = await pos.find({id: req.user.id}).toArray()
    const currentPage = ls("currentPage")
    const currentPageFive = ls("currentPageFive")
    res.render("main.ejs", {
        userSession: req.user,
        post : post,
        current : currentPage,
        currentFive : currentPageFive
    })
})

router.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/diary');
    });
});




//<--------------POST------------->

router.post("/register", async (req, res)=>{
    let id = req.body.id
    let pw = req.body.pw
    let real_pw = req.body.pw
    let nn = req.body.nn

    const saltRounds = 10
    const p = await col.findOne({id: id})

    bcrypt.hash(pw, saltRounds, (err, hash)=>{
        try{
            if (p) {
                res.send({code: 0})
            } else {
                col.insertOne({nn: nn, id: id, pw: real_pw, pw_hash: hash})
                res.send({code: 1})
            }
        } catch (err) {
            console.log(err)
        }
    })
})



router.post("/login", passport.authenticate("local", {
    failureRedirect: '/diary/login'
}), (req, res) => {
    res.send({code: 1})
})


router.post("/main", async(req, res)=>{
    try {
        let code = req.body.code
        let id = req.user.id
        let _id = req.body._id
        let title = req.body.title
        let content = req.body.content
        let date = req.body.date
        let page = req.body.page
        let pageFive = req.body.pageFive

        if (code == 3) {
            const p = await pos.findOne({
                _id : new ObjectId(_id)
            })
            res.send({title: p.title, content: p.content})
        } else if (code == 4) {
            await pos.updateOne(
                { _id : new ObjectId(_id) },
                {$set: {
                    title: title,
                    content: content
                }}
            )
            res.send({code: 1})
        } else if (code == 2){
            await pos.deleteOne({
                _id: new ObjectId(_id)
            })
            res.send({code: 2})
        } else if (code == "page"){
            ls("currentPage", page)
            res.send({code: "pagemove"})
        } else if (code == "pageFive") {
            ls("currentPage", 5*pageFive + 1)
            ls("currentPageFive", pageFive)
            res.send({code: "pagemove"})
        } else {
            await pos.insertOne({
                id: id,
                title: title,
                content: content,
                date: date
            })
            res.send({code: 1})
        }
        } catch {
            res.send({code: 100})
        }
})


router.post("/mypage", async (req, res)=>{
    try{
        let _id = req.body._id
        let nn = req.body.nn
        let pw = req.body.pw

        if (code= "edit"){
            const saltRounds = 10
            bcrypt.hash(pw, saltRounds, (err, hash)=>{
                try{
                    col.updateOne({ _id : new ObjectId(_id) },
                    {$set: {
                        nn: nn,
                        pw: pw,
                        pw_hash: hash
                    }})
                    res.send({code: 1})
        
                } catch (err) {
                    console.log(err)
                }
            })
        } else {
            req.logOut()
            req.session.save(function(){
                res.redirect('/diary');
            })
            res.send(1)
        }
    } catch {
        res.send({code: 100})
    }
})

module.exports = router

