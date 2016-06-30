/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  Image,
  View,
  ListView,
  TouchableHighlight
} from 'react-native';

//var TimerMixin = require('react-timer-mixin');
import TimerMixin from 'react-timer-mixin';

var apiBaseUrl = 'https://0c575ac1.ngrok.io';

class Designs  extends Component{
  constructor(props, context) {
    super(props, context);
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    var dd = ds.cloneWithRows([]);
    this.state = {dataSource: dd, errMsg:''};
  };

  componentDidMount() {
    this._trieveData();
    TimerMixin.setInterval(
      () => { console.log('loading again'); this._trieveData();},
      30000
    );
  }

  _trieveData() {
    var self = this;

   fetch(apiBaseUrl + '/api/getBucketObjects', {
      body:null,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }).then((response) => response.text())
        .then((responseText) => {
          var existingSectionIdentity = this.state.dataSource.sectionIdentities[0];
          var existingArr = this.state.dataSource._dataBlob[existingSectionIdentity];
          var existingObjs = {};
          existingArr.forEach(function(obj) {
            existingObjs[obj.objectId] = obj;
          });
          try {
            var objs = JSON.parse(responseText);
          } catch(e) {
            errMsg = "Data cannot be retrieve from server now";
            self.setState({errMsg:errMsg});
            return;
          }

          var proms = objs.map(function(obj) {            
            var oid = obj.objectId;
            var existingObj = existingObjs[oid];
            if(existingObj && existingObj.base64 && existingObj.base64.length > 0) return Promise.resolve(existingObj);
            obj.date = Date.now();
            obj.key = obj.objectKey;

            var url = apiBaseUrl + '/api/getThumbnail/'+encodeURIComponent(oid);
            return fetch(url, {body:null, method:'GET', headers:{'Accept': 'application/json'}}).then((response1) => response1.text()).then(
              (responseText1) => {
                console.log('thumbnail for url', oid);
                obj.base64 = responseText1; 
                return obj;
              });
          }); //forEach
          Promise.all(proms).then(values=>{
            values.sort(function(v1, v2) {
              if(!v1.base64 || v1.base64.length <= 500) return 1; //some invalid base64 has length > 0
              if(v1.date == v2.date) return 0;
              else if(v1.date > v2.date) return -1;
              else return 1;
            });
            var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.objectId !== r2.objectId});
            var dd = ds.cloneWithRows(values);   
            self.setState({dataSource:dd});
          });

    })

  }

  render () {
    var msg = '';
    if(this.state.errMsg) {
      msg = this.state.errMsg;
    } else {
      msg = '# of designs in your project:' + this.state.dataSource._cachedRowCount;
    }
    return (
    <View style={styles.listViewWrapper}>
      <Text style={styles.count}> {msg} </Text>
      <ListView
        style={styles.listViewContainer}
        dataSource={this.state.dataSource}
        renderRow={(rowData, sectionID, rowID) => 
          <TouchableHighlight onPress={() => {
            this._pressRow(rowID);
            //highlightRow(sectionID, rowID);
          }}>
            <View>
              <View style={styles.row}>
                <Image style={styles.thumb} source={{uri: rowData.base64}} />
                <Text style={styles.bucketKey}>{rowData.key}</Text>
              </View>
            </View>
          </TouchableHighlight>
        }
        renderSeparator={this._renderSeperator}
        enableEmptySections={true}
      />
    </View>
    );
  }

  _pressRow(rowID) {
    console.log('clickd row: ', rowID);
  }
  _renderHeader() {
 	  return (<Text>This is some text. This is some text. This is some text. This is some text.</Text>);
  }

  _renderSeperator(sectionID, rowID, adjacentRowHighlighted) {
    return (
      <View
        key={`${sectionID}-${rowID}`}
        style={{
          height: adjacentRowHighlighted ? 4 : 1,
          backgroundColor: adjacentRowHighlighted ? '#3B5998' : '#CCCCCC',
        }}
      />
    );
  }  
};

class mobileClient extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      token: '',
      bucketObjects: []
    };
  };

  componentDidMount() {
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Autodesk Hackthon Project Viewer
        </Text>
        <Designs></Designs>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  listViewWrapper: {
      flex: 1,
      flexDirection: 'column',
  },    
  listViewContainer: {
      flex: 1,
      flexDirection: 'column',
  },  
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  bucketKey: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    padding: 0,
  },
  thumb: {
    width: 64,
    height: 64,
  },
  text: {
    flex: 1,
    justifyContent: 'center',
    marginTop:22,
  },  
  cout: {
    fontSize: 16,
    textAlign: 'center',
    margin: 10,
    marginBottom:20
  }, 
});

AppRegistry.registerComponent('mobileClient', () => mobileClient);
