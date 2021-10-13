// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract cTwitter {
    uint256 internal postsLength;
    address public adminAddress;

    struct Post {
        address payable owner;
        string name;
        string image;
        string post;
        uint256 date;
        uint256 likes;
    }

    struct Comment {
        address commenter;
        uint256 date;
        string comment;
    }

    modifier postExists(uint256 _index) {
        postExist(_index);
        _;
    }

    // ensure function can only be called by admin
    modifier onlyOwner() {
        // function checks if the caller is admin
        // calling a function in a modifier reduces contract byte code size
        isAdminFunc();
        _;
    }

    // ensure function can only be calledonly an address that hasnt been ban
    modifier onlyNotBan(address _address) {
        // calling a function in a modifier reduces contract byte code size
        onlyNotBanFunc(_address);
        _;
    }

    mapping(uint256 => Post) internal posts;

    // mapping to store ban users
    mapping(address => bool) internal isBan;

    // maps a user address to mapping of post ID to a boolean
    mapping(address => mapping(uint256 => bool)) internal likedPosts;
    // map comments array to an ID
    mapping(uint256 => Comment[]) internal comments;
    mapping(uint256 => uint256) internal commentLength;

    constructor() {
        postsLength = 0;
        adminAddress = msg.sender;
    }

    // function to check if caller is an admin
    function isAdminFunc() internal view {
        require(
            msg.sender == adminAddress,
            "Function can only be accessed by owner."
        );
    }

    function onlyNotBanFunc(address _address) internal view {
        require(
            checkBanStatus(_address) != true,
            "You have been ban and cannot call this function"
        );
    }

    // function to check if a post exists
    function postExist(uint256 _index) internal view {
        Post storage _post = posts[_index];
        require(_post.owner != address(0), "Post with this ID does not exist");
    }

    // Add new post on cTwitter
    function addPost(
        string memory _name,
        string memory _image,
        string memory _post
    ) public onlyNotBan(msg.sender) {
        uint256 _likes = 0;
        posts[postsLength] = Post(
            payable(msg.sender),
            _name,
            _image,
            _post,
            block.timestamp,
            _likes
        );
        postsLength++;
    }

    // Get post based on unique index
    function getPost(uint256 _index)
        public
        view
        postExists(_index)
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256
        )
    {
        Post storage _post = posts[_index];
        return (
            _post.owner,
            _post.name,
            _post.image,
            _post.post,
            _post.date,
            _post.likes
        );
    }

    // Like post
    function likePost(uint256 _index)
        public
        postExists(_index)
        onlyNotBan(msg.sender)
    {
        require(
            likedPosts[msg.sender][_index] == false,
            "Already liked this post"
        );
        likedPosts[msg.sender][_index] = true;
        posts[_index].likes++;
    }

    //Get number of posts
    function getPostsLength() public view returns (uint256) {
        return (postsLength);
    }

    //Checks if post was liked by specific user
    function isPostLiked(address _user, uint256 _index)
        public
        view
        returns (bool)
    {
        return likedPosts[_user][_index];
    }

    function getCommentLength(uint256 _index) public view returns (uint256) {
        return (commentLength[_index]);
    }

    // create a comment
    function comment(uint256 _index, string memory _comment)
        public
        onlyNotBan(msg.sender)
        postExists(_index)
    {
        comments[_index].push(Comment(msg.sender, block.timestamp, _comment));
        commentLength[_index]++;
    }

    // get all comments in a particular post
    function getComments(uint256 _index)
        public
        view
        returns (Comment[] memory)
    {
        return comments[_index];
    }

    function banAddress(address _address) public returns (bool) {
        isBan[_address] = true;
        return true;
    }

    function unBanAddress(address _address) public returns (bool) {
        isBan[_address] = false;
        return true;
    }

    function checkBanStatus(address _address) public view returns (bool) {
        return isBan[_address];
    }
}
