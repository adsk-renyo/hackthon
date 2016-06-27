(function(){ "use strict";

    var EXTENSION_NAME = 'Autodesk.Comments';
    var namespace = AutodeskNamespace('Autodesk.Viewing.Comments');

    /**
     * Extension that encapsulates functionality to create AJAX calls to
     * a commenting endpoint for post/get/delete comment operations.
     * Notice that most of the exposed functions return a Promise object.
     *
     * @param {Object} viewer - LMV instance
     * @param {Object} options - Dictionary with options
     * @param {String} options.env - Signals which endpoint environment to use. Same values as LMV.
     * @param {String} options.url - identifier that groups comments together
     * @param {String} options.oauth2token - 3-legged Oauth 2 token used to access endpoints
     * @param {Boolean} options.fakeServer - Forces the usage of a local proxy for all async operations with endpoints
     * @param {Number} options.fakeSeverDelay - Forced delay for fakeServer proxy. Useful to test high/low latency ops
     * @constructor
     */
    function CommentsExtension(viewer, options) {
        Autodesk.Viewing.Extension.call(this, viewer, options);
    }

    CommentsExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
    CommentsExtension.prototype.constructor = CommentsExtension;
    var proto = CommentsExtension.prototype;

    // Extension interface //

    proto.load = function () {
        this.factory = new namespace.CommentFactory(this.viewer);
        this.commentService = new namespace.CommentService();
        this.commentService.init(this.options);
        return true;
    };

    proto.unload = function() {
        this.commentService = null;
        return true;
    };

    // Public interface //

    /**
     * Set the geometryItem to enhance createComment() so that it injects sheet data.
     * See Autodesk.Viewing.Document.getSubItemsWithProperties for more info on items.
     *
     * @param {Object} item - Data object that gives additional info on the loaded model.
     */
    proto.setGeometryItem = function(item) {
        this.factory.geometryItem = item;
    };

    /**
     * Creates a comment object that can be posted to the Comment Service endpoint.
     * Example: User could perform: postComment(createCommentObj());
     * @param {String} message - Text attached to the comment.
     */
    proto.createCommentObj = function(message) {
        return this.factory.createCommentObj(message);
    };

    /**
     * Applies transformations to make the commentObj compatible with other
     * offline Autodesk applications (such as Fusion 360).
     *
     * WARNING: Never call this function more than once per commentObj.
     *
     * @param {Object} commentObj - The Comment object, see createCommentObj()
     */
    proto.exportCommentObj = function(commentObj) {
        this.factory.exportCommentObj(commentObj);
    };

    /**
     * Applies transformations to make the commentObj compatible with LMV.
     * May be required when comment was generated from/for offline Autodesk
     * applications (Such as Fusion 360)
     *
     * WARNING: Never call this function more than once per commentObj.
     *
     * @param commentObj
     */
    proto.importCommentObj = function(commentObj) {
        this.factory.importCommentObj(commentObj);
    };

    /**
     * Sets a token to be used for all endpoint operations
     * @param {String} token - 3-legged Auth2 token
     */
    proto.setToken = function(token) {
        this.commentService.setToken(token);
    };

    /**
     * Sets the REST endpoint's id which groups comments
     * @param {String} path - This of it as the folder name that contains comments
     */
    proto.setPathStorage = function(path) {
        if (!path) {
            throw new Error(EXTENSION_NAME + ": Invalid path storage");
        }
        this.commentService.setPathStorage(path);
    };

    /**
     * Fetches all comments from the Comments Service
     * @return {Promise}
     */
    proto.getComments = function() {
        return this.commentService.listComments();
    };

    /**
     * Post a comment to the Comment Service backend
     *
     * @param {Object} comment - Object to post (will get JSON.stringify())
     * @param {Array} [xhrHeaders] - Array of {name:String, value:String} for additional header insertion
     * @return {Promise}
     */
    proto.postComment = function(comment, xhrHeaders) {
        return this.commentService.postComment(comment, xhrHeaders)
    };

    /**
     * Posts a comments reply. A reply has the same structure as the one required for postComment()
     *
     * @param {Object} commentReply - Object to post as a reply (will get JSON.stringify())
     * @param {String} parentCommentId - Id of the comment replying to.
     * @return {Promise}
     */
    proto.postCommentReply = function(commentReply, parentCommentId) {
        return this.commentService.postCommentReply(commentReply, parentCommentId);
    };

    /**
     * Deletes a comments from the Comment Service backend
     * @param {String} commentId - id of the comment to remove
     * @return {Promise}
     */
    proto.deleteComment = function(commentId) {
        return this.commentService.deleteComment(commentId);
    };

    /**
     * Deletes a comment reply. Under the hood, it is the same call as deleteComment()
     * @param commentReplyId
     * @return {Promise}
     */
    proto.deleteCommentReply = function(commentReplyId) {
        return this.deleteComment(commentReplyId);
    };

    /**
     * Used to get an OSS location where to post a new attachment
     * @param {Array} additionalHeaders - Additional request headers
     * @param {Object} callbacks - {onLoad:Function, onError:Function, onTimeout:Function}
     */
    proto.fetchLocationForNewOssAttachment = function(additionalHeaders, callbacks) {
        // TODO: Promisify method //
        return this.commentService.fetchLocationForNewOssAttachment(additionalHeaders, callbacks);
    };

    /**
     * Helps extracting information after calling fetchLocationForNewOssAttachment()
     *
     * @param {String} ossUrn - value returned from fetchLocationForNewOssAttachment()
     * @returns {Array} with 2 elements: [ <bucket_id>, <attachment_id> ]
     */
    proto.extractOssBucketAndId = function(ossUrn) {
        return this.commentService.extractOssBucketAndId(ossUrn);
    };

    /**
     * Posts an attachment to the attachments endpoint (OSS by default)
     * Relies on the return value of fetchLocationForNewOssAttachment()
     * Use extractOssBucketAndId() to extract data out of it.
     *
     * @param {String} objectKey - attachment's id.
     * @param {String|*} fileData - attachment data to post
     * @param {String} bucketId - Id of the OSS bucket where to post the attachment
     * @param {Array} [additionalHeaders] - Additional request headers
     * @param {Object} callbacks - {onLoad:Function, onError:Function, onTimeout:Function}
     */
    proto.postAttachment = function(objectKey, fileData, bucketId, additionalHeaders, callbacks) {
        // TODO: Promisify method //
        return this.commentService.postAttachment(objectKey, fileData, bucketId, additionalHeaders, callbacks);
    };

    /**
     * Initiates an async op to request an attachment from the attachments endpoint (oss by default)
     * Returns a promise.
     *
     * @param {String} urn
     * @param {Boolean} isBinary - Whether we are fetching binary data or not
     * @param {Array} [additionalHeaders] - Additional request headers
     * @returns {Promise}
     */
    proto.getAttachment = function(urn, isBinary, additionalHeaders) {
        return this.commentService.getAttachment(urn, isBinary, additionalHeaders);
    };

    Autodesk.Viewing.theExtensionManager.registerExtension(EXTENSION_NAME, CommentsExtension);
    namespace.CommentsExtension = CommentsExtension;
})();
