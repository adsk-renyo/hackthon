(function(){ "use strict";

    var namespace = AutodeskNamespace('Autodesk.Viewing.Comments');

    function CommentFactory(viewer) {

        this.viewer = viewer;
        this.geometryItem = null;
        this.filter = {
            seedURN: true,
            objectSet: true,
            viewport: true,
            tags: true, // Animation extension uses tags.
            renderOptions: false,
            cutplanes: true
        };
    }

    var proto = CommentFactory.prototype;

    /**
     * Creates a comment object that can be posted to the comment end point.
     * @param {String} message - message linked to the comment.
     * @return {Object} a comment object
     */
    proto.createCommentObj = function(message) {
        var commentObj = this.viewer.getState(this.filter);
        this.injectInfo(commentObj, message);
        return commentObj;
    };

    /**
     * Populates comment object with data common
     * @param {Object} commentObj
     * @param {String} message
     */
    proto.injectInfo = function(commentObj, message) {
        commentObj["body"] = message;
        commentObj["status"] = 'open';
        commentObj["jsonVersion"] = "2.0";
        commentObj["inputSource"] = "Web";
        commentObj["type"] = "geometry";

        // These lines include model's sheet info within the document.
        if (this.geometryItem) {
            commentObj["layoutName"] = this.geometryItem.guid;
            commentObj["layoutIndex"] = this.geometryItem.order;
        }
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
        this.applyGlobalOffset(commentObj);
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
        this.removeGlobalOffset(commentObj);
    };

    /////////////////////////////
    //// AUXILIARY FUNCTIONS ////
    /////////////////////////////

    /**
     * To make the Viewer's state associated in the comment compatible with
     * external apps, make sure that LMV's global offset gets removed using
     * this method.
     *
     * WARNING: Call this method only once per created commentObj
     *
     * @param {Object} commentObj - output of createComment() function
     * @returns {boolean} - Transformation applied or not
     */
    proto.applyGlobalOffset = function(commentObj) {
        var globalOffset = this.viewer.model.getData().globalOffset;
        if (globalOffset) { // globalOffset is null for 2d models.
            this.applyOffsetToCamera(commentObj.viewport, globalOffset);
            return true;
        }
        return false;
    };

    /**
     * When loading an comment object created for/from an external application,
     * this method will apply LMV's globalOffset transformation.

     * WARNING: Call this method only once per commentObj
     *
     * @param {Object} commentObj - output of createComment() function
     * @returns {boolean} - Transformation applied or not
     */
    proto.removeGlobalOffset = function(commentObj) {
        var globalOffset =  this.viewer.model.getData().globalOffset;
        if (globalOffset) {
            var invGlobalOffset = { x: -globalOffset.x, y: -globalOffset.y, z: -globalOffset.z };
            this.applyOffsetToCamera(commentObj.viewport, invGlobalOffset);
            return true;
        }
        return false;
    };

    /**
     *
     * @param {Object} viewport - viewport aspect of the ViewerState object
     * @param {Object} offset - {x:Number, y:Number, z:Number}
     * @private
     */
    proto.applyOffsetToCamera = function(viewport, offset) {

        if (!viewport || !offset) {
            return;
        }

        if ('eye' in viewport) {
            viewport['eye'][0] =  (Number(viewport['eye'][0]) + offset.x).toString();
            viewport['eye'][1] =  (Number(viewport['eye'][1]) + offset.y).toString();
            viewport['eye'][2] =  (Number(viewport['eye'][2]) + offset.z).toString();
        }

        if ('target' in viewport) {
            viewport['target'][0] = (Number(viewport['target'][0]) + offset.x).toString();
            viewport['target'][1] = (Number(viewport['target'][1]) + offset.y).toString();
            viewport['target'][2] = (Number(viewport['target'][2]) + offset.z).toString();
        }

        if ('pivotPoint' in viewport) {
            viewport['pivotPoint'][0] =  (Number(viewport['pivotPoint'][0]) + offset.x).toString();
            viewport['pivotPoint'][1] =  (Number(viewport['pivotPoint'][1]) + offset.y).toString();
            viewport['pivotPoint'][2] =  (Number(viewport['pivotPoint'][2]) + offset.z).toString();
        }
    };

    namespace.CommentFactory = CommentFactory;
})();