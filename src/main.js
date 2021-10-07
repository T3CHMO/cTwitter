import Web3 from "web3"
import { newKitFromWeb3 } from "@celo/contractkit"
import BigNumber from "bignumber.js"
import ctwitterAbi from "../contract/ctwitter.abi.json"

const DECIMALS = 18
const MPContractAddress = "0xD1e673bcb81981d7d532942902fCc2633adc4cB3"

let kit
let contract
let products = []

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.")
    try {
      await window.celo.enable()
      notificationOff()

      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(ctwitterAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.")
  }
}


const getUser = async function () {
  document.querySelector("#avatar").innerHTML = identiconTemplate(kit.defaultAccount);
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.CELO.shiftedBy(-DECIMALS).toFixed(2)
  document.querySelector("#balance").textContent = cUSDBalance
}

async function isPostLiked(user, index) {
  return await contract.methods.isPostLiked(user, index).call()
}

async function getComments(index) {
  return await contract.methods.getComments(index).call()
}

const getPosts = async function () {
  const _postLength = await contract.methods.getPostsLength().call()
  const _posts = []
  for (let i = 0; i < _postLength; i++) {
    let _post = new Promise(async (resolve, reject) => {
      let p = await contract.methods.getPost(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        post: p[3],
        date: new Date(p[4] * 1000),
        likes: p[5],
        liked: await isPostLiked(kit.defaultAccount, i),
        comments: await getComments(i)
      })
    })
    _posts.push(_post)
  }
  products = await Promise.all(_posts)
  renderProducts()
}

function renderProducts() {
  document.getElementById("ctwitter").innerHTML = ""
  products.forEach((_post) => {
    const newDiv = document.createElement("div")
    newDiv.className = "col-lg-6 col-md-8 col-xs-12 col-centered"
    newDiv.innerHTML = productTemplate(_post)
    document.getElementById("ctwitter").appendChild(newDiv)
  })
}

function productTemplate(_post) {
  return `
    <div class="card mb-4">
      ${showImg(_post.image)}
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
         ${_post.likes} Likes
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_post.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_post.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_post.post}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-clock-fill"></i>
          <span>${_post.date}</span>
        </p>
        <div class="d-grid gap-2">
        <span>
        <div class="input-group">
        <div class="input-group-prepend"></div>
        <textarea id=comment_${_post.index} class="form-control p-2" style="margin-bottom:10px" aria-label="With textarea"></textarea>
        </div>
          ${boolToLikes(_post.liked, _post.index)}
          <button class="btn btn-sm btn-outline-dark fs-6 p-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">Show comments</button>
            <a class="btn btn-sm btn-outline-dark commentBtn fs-6 p-2" id=${_post.index} >Comment</a>
            </span>
          <div class="collapse" id="collapseExample">
            <div class="card card-body">
              ${formatComments(_post.comments)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function showImg(_image) {
  if (_image != "") {
    return `<img class="card-img-top" src="${_image}" alt="..."></img>`
  } else {
    return `<div></div>`
  }
}

function formatComments(comments) {
  let result = ''
  comments.forEach(element => {
    result+= `<span style="display: inline-flex;align-items: center;">`+identiconTemplate(element[0])+``+element[2]+`</span>`
    result+= `<span>`+new Date(element[1] * 1000)+`</span>`
  })

  return result
}

function boolToLikes(_bool, _index) {
  if (_bool) {
    return `<a class="btn btn-sm btn-outline-dark likeBtn fs-6 p-2 disabled" id=${_index}>Liked</a>`
  } else {
    return `<a class="btn btn-sm btn-outline-dark likeBtn fs-6 p-2" id=${_index}>Like this post</a>`
  }
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL()

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block"
  document.querySelector("#notification").textContent = _text
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none"
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...")
  await connectCeloWallet()
  await getBalance()
  await getUser()
  await getPosts()
  notificationOff()
});

document
  .querySelector("#newPostBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newPostName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newPost").value
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods
        .addPost(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getPosts()
  })

document.querySelector("#ctwitter").addEventListener("click", async (e) => {
  if (e.target.className.includes("likeBtn")) {
    const index = e.target.id
    notification(`⌛ Awaiting to like "${products[index].name}"...`)
    try {
      const result = await contract.methods
        .likePost(index)
        .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully liked "${products[index].name}".`)
      getPosts()
      getBalance()
      getUser()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})

document.querySelector("#ctwitter").addEventListener("click", async (e) => {
  if (e.target.className.includes("commentBtn")) {
    const index = e.target.id
    const id = "#comment_"+index
    const comment = document.querySelector(id)
    notification(`⌛ Awaiting to comment "${products[index].name}"...`)
    try {
      const result = await contract.methods.comment(index, comment.value).send({ from: kit.defaultAccount })
      notification(`🎉 You successfully commented "${products[index].name}".`)
      getPosts()
      getBalance()
      getUser()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})