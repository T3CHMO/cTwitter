// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract cTwitter {

    uint internal postsLength = 0;

    struct Posts {
        address payable owner;
        string name;
        string image;
        string post;
        uint date;
        uint likes;
    }
    
    struct Comment {
        address commenter;
        uint date;
        string comment;
    }

    mapping (uint => Posts) internal posts;
    mapping (address => mapping(uint => bool)) internal likedPosts;
    mapping (uint => Comment[]) internal comments;
    mapping (uint => uint) internal commentLength;

    
    // Add new post on cTwitter
    function addPost(string memory _name, string memory _image, string memory _post) public {
        uint _likes = 0;
        posts[postsLength] = Posts(payable(msg.sender), _name, _image, _post, block.timestamp, _likes);
        postsLength++;
    }

    // Get post based on unique index
    function getPost(uint _index) public view returns (address payable, string memory, string memory, string memory, uint, uint) {
        return (
            posts[_index].owner,
            posts[_index].name, 
            posts[_index].image, 
            posts[_index].post, 
            posts[_index].date,
            posts[_index].likes
        );
    }
    
    // Like post
    function likePost(uint _index) public {
        require(likedPosts[msg.sender][_index] == false, "Already liked this post");
        likedPosts[msg.sender][_index] = true;
        posts[_index].likes++;
    }
    
    //Get number of posts
    function getPostsLength() public view returns (uint) {
        return (postsLength);
    }
    
    //Checks if post was liked by specific user
    function isPostLiked(address _user, uint _index) public view returns (bool) {
        return likedPosts[_user][_index];
    }
    
    function getCommentLength(uint _index) public view returns (uint) {
        return (commentLength[_index]);
    }
    
    function comment(uint _index, string memory _comment) public {
        comments[_index].push(Comment(msg.sender, block.timestamp, _comment));
        commentLength[_index]++;
    }
    
    function getComments(uint _index) public view returns (Comment[] memory) {
        return comments[_index];
    }
    
    
}
}
