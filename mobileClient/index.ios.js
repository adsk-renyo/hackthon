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

class Designs  extends Component{
  constructor(props, context) {
    super(props, context);
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    var dd = ds.cloneWithRows([]);
    this.state = {dataSource: dd};
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
    fetch('http://localhost:3000/api/getBucketObjects', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }).then((response) => response.text())
        .then((responseText) => {
          var objs = JSON.parse(responseText);
          var proms = objs.map(function(obj) {
            var oid = obj.objectId;
            var url = 'http://localhost:3000/api/getThumbnail/'+encodeURIComponent(oid);
            return fetch(url, {method:'GET', headers:{'Accept': 'application/json'}}).then((response1) => response1.text()).then(
              (responseText1) => {obj.base64 = responseText1; return obj});
          }); //forEach
          Promise.all(proms).then(values=>{
            var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.objectId !== r2.objectId});
            var dd = ds.cloneWithRows(values);   
            self.setState({dataSource:dd});
            console.log('aaa');
          });

    })
  }

  render () {
    console.log('Designs data:', this.state.dataSource);
    return (
    <View>
      <Text style={styles.count}> # of designs in your project: {this.state.dataSource._cachedRowCount} </Text>
      <ListView
        dataSource={this.state.dataSource}
        renderRow={(rowData, sectionID, rowID) => 
          <TouchableHighlight onPress={() => {
            this._pressRow(rowID);
            //highlightRow(sectionID, rowID);
          }}>
            <View>
              <View style={styles.row}>
                <Image style={styles.thumb} source={{uri: rowData.base64}} />
                <Text style={styles.bucketKey}>{rowData.objectKey}</Text>
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
