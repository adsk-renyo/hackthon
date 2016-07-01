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
  TouchableHighlight,
  Navigator,
  TouchableOpacity,
  TextInput
} from 'react-native';

//var TimerMixin = require('react-timer-mixin');
import TimerMixin from 'react-timer-mixin';

var apiBaseUrl = 'https://988ad979.ngrok.io';
var base64ImageHeader = 'data:image/png;base64,';

class Designs  extends Component{
  constructor(props, context) {
    super(props, context);
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    var dd = ds.cloneWithRows([]);
    this.state = {dataSource: dd, allDesigns:[], errMsg:'', searchText:'', searchResults:undefined};
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
            if(existingObj && existingObj.base64 && existingObj.base64.length > base64ImageHeader.length + 1) return Promise.resolve(existingObj);
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
            self.setState({allDesigns: values.slice(0)});
            self._filterBySearch();
          });
    })
  }

  _filterBySearch() {
      var searchResults = this.state.searchResults;
      var filtered = this.state.allDesigns;
      if(this.state.searchText && this.state.searchText.length > 0 && searchResults) {
        filtered = filtered.filter((item)=>{
          var bFound = false;
          for(let i=0; i<searchResults.length; ++i) {
            var expObj = searchResults[i];
            if(item.objectKey == expObj.file) {
              bFound = true;
              break;
            }
          }
          return bFound;
        });
      }

      var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1.objectId !== r2.objectId});
      var dd = ds.cloneWithRows(filtered);   
      this.setState({dataSource:dd});
  }

  _handleSearchPress() {
    var text = this.state.searchText;
    var num = parseInt(text);
    console.log('search text: ', num);
    if(text.length <= 0 || num<= 0 || num === NaN) {
      this.setState({searchResults:undefined});
      this._filterBySearch();
      return;
    }
    fetch(apiBaseUrl + '/api/fetch/' + num, {
      body:null,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }).then((response1) => response1.text()).then((txt)=>{
      var searchResults = JSON.parse(txt);
      this.setState({searchResults:searchResults});
      console.log(txt);
      this._filterBySearch();
    });
  }

  render () {
    var msg = '';
    if(this.state.errMsg) {
      msg = this.state.errMsg;
    } else {
      msg = '# of designs in your project:' + this.state.dataSource._cachedRowCount;
    }
      // <TouchableOpacity onPress={()=>this._handleSearchPress()}>
      // 	<Text style={styles.button}>Search</Text>
      // </TouchableOpacity>     

    return (
    <View style={styles.listViewWrapper}>
 
      <TextInput
        style={{height: 40, borderColor: 'gray', borderWidth: 1, paddingLeft:10}}
        onChangeText={(text) => {
          this.setState({searchText:text});
          this._handleSearchPress();
        }}
        value={this.state.text}
        keyboardType='number-pad'
        placeholder='max # triangles'
      />
    
      <Text style={styles.count}> {msg} </Text>
      <ListView
        style={styles.listViewContainer}
        dataSource={this.state.dataSource}
        renderRow={(rowData, sectionID, rowID) => 
          <TouchableHighlight onPress={() => {
            this._pressRow(rowID);
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
    var existingSectionIdentity = this.state.dataSource.sectionIdentities[0];
    var existingArr = this.state.dataSource._dataBlob[existingSectionIdentity];
    var activeDesign =  existingArr[rowID];   
    this.props.navigator.push({id:'DesignDetailPage', activeDesign: JSON.stringify(activeDesign)});
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
  }

  render() {
    return (<Navigator
      initialRoute={{id:"DesignListView"}}
      renderScene={this._navRenderScene}
    />);
  }

  _navRenderScene(route, navigator) {
    switch(route.id) {
      case "DesignListView":
        return(<DesignListView navigator={navigator}></DesignListView>);
      case "DesignDetailPage":
        return(<DesignDetailPage navigator={navigator}></DesignDetailPage>);
      default:
        return(<DesignListView navigator={navigator}></DesignListView>);
    }
  }
}

class DesignListView extends Component {
  constructor(props, context) {
    super(props, context);
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Hackthon Project Viewer
        </Text>
        <Designs navigator={this.props.navigator} ></Designs>
      </View>
    );
  }
};

class DesignDetailPage extends Component {
  constructor(props, context) {
    super(props, context);
    var dataObj = this.props.navigator.navigationContext.currentRoute;
    var activeDesign = JSON.parse(dataObj.activeDesign);    
    this.state = {activeDesign: activeDesign, meshProps:{}};
  }
  componentDidMount() {
    var activeDesign = this.state.activeDesign;
    
    fetch(apiBaseUrl + '/api/getMeshProps/' + activeDesign.objectKey, {
      body:null,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    }).then((response1) => response1.text()).then((txt)=>{
      try {
        var meshProps = JSON.parse(txt);
        this.setState({meshProps:meshProps});
        console.log('mesh props', meshProps);
      } catch(e) {
        console.log(e);
      }

    });
  }

  _handlePress() {
    this.props.navigator.pop();
  }
  render() {
    var activeDesign = this.state.activeDesign;
    var propsNode = [];
    var meshProps = this.state.meshProps;
    for(var keyName in meshProps) {
      if(meshProps.hasOwnProperty(keyName)) {
        propsNode.push(<Text style={styles.bucketKey} key={keyName}>{keyName} : {meshProps[keyName]}</Text>)
      }
    }
    return (
      <View style={[styles.container]}>
        <Text style={styles.welcome}>{activeDesign.objectKey}</Text>
        <Image style={styles.thumbBig} source={{uri: activeDesign.base64}} />
        {propsNode}
        <TouchableOpacity onPress={()=>this._handlePress()}>
            <Text style={styles.button}>Go back</Text>
        </TouchableOpacity>
       </View>
    )
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
  thumbBig: {
    width: 100,
    height: 100,
    margin:10,
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
  button: {
    backgroundColor: 'grey',
    fontSize: 16,
    textAlign: 'center',
    justifyContent: 'center',
    margin: 10,    
  }
});

AppRegistry.registerComponent('mobileClient', () => mobileClient);
