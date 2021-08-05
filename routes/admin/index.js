

module.exports = app =>{
    const express = require('express')
   
    const router = express.Router({
      mergeParams:true
    })
    //登录校验中间件
    const authMiddleware = require('../../middleware/auth')
    //资源中间件
    const resourceMiddleware = require('../../middleware/resource')
    // 资源路由
    router.post('/',async(req,res)=>{
      const model = await req.Model.create(req.body)
      res.send(model)
    })
    router.put('/:id',async(req,res)=>{
      const model = await req.Model.findByIdAndUpdate(req.params.id,req.body)
      res.send(model)
    })
    router.delete('/:id',async(req,res)=>{
      await req.Model.findByIdAndDelete(req.params.id,req.body)
      res.send({
        success:true
      })
    })
    router.get('/',async(req,res)=>{
      const queryOptions = {}
      if(req.Model.modelName === 'Category'){
        queryOptions.populate = 'parent'
      }
      //pupulate(关联查询查出子类)
      const items = await req.Model.find().setOptions(queryOptions).limit(100)
      res.send(items)
    })
    router.get('/:id',async(req,res)=>{
      const model = await req.Model.findById(req.params.id)
      res.send(model)
    })

    //解析参数,生成model的名字
    app.use('/admin/api/rest/:resource',authMiddleware(),resourceMiddleware(),router)



    //上传图片
    const multer = require('multer')
    const upload = multer({dest:__dirname+'/../../uploads'})
    app.post('/admin/api/upload',authMiddleware(),upload.single('file'), async(req,res)=>{
      const file = req.file
      file.url = `http://localhost:3000/uploads/${file.filename}`
      res.send(file)
    })

    
    
    //登录接口
    app.post('/admin/api/login',async(req,res)=>{
      const {username,password} = req.body
      // 根据用户名找用户
      const AdminUser = require('../../models/AdminUser')
      const assert = require('http-assert')
      const jwt = require('jsonwebtoken')
      const user = await AdminUser.findOne({username}).select('+password')
      // 验证用户是否存在
      assert(user,422,'用户不存在')
      
      //验证密码是否正确 
      const isValid =  require('bcrypt').compareSync(password,user.password)
      assert(isValid,422,'token错误')

      // 生成token
      const token = jwt.sign({id:user._id},app.get('secret'))
      res.send({token})
    })
    app.use(async(err,req,res,next)=>{
      res.status(err.statusCode || 500).send({
        message:err.message
      })
    })
}