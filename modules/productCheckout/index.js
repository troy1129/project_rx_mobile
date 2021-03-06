import React, { Component, useState } from 'react';
import Style from './Style.js';
import { View, Image, TouchableHighlight, Text, ScrollView, FlatList,TouchableOpacity,Button,StyleSheet, ColorPropType,TextInput,PermissionsAndroid} from 'react-native';
import { Spinner, Empty, SystemNotification,GooglePlacesAutoComplete,ImageUpload} from 'components';
import { connect } from 'react-redux';
import { Dimensions } from 'react-native';
import { Color, Routes ,BasicStyles} from 'common'
import Api from 'services/api/index.js'
import { NavigationActions } from 'react-navigation'
import MapView, { PROVIDER_GOOGLE, Marker,Callout } from 'react-native-maps';
const width = Math.round(Dimensions.get('window').width);
const height = Math.round(Dimensions.get('window').height);
import { Divider } from 'react-native-elements';
import _, { isError } from 'lodash'
import {faEdit} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import Geolocation from '@react-native-community/geolocation';
import { Row } from 'native-base';
import { CheckoutCard } from 'components/Checkout';
import TearLines from "react-native-tear-lines";




class productCheckout extends Component{
  
  constructor(props){
    super(props);
    this.state = {
    data:[],
    address:[],
    merchantID:null,
     showStatus:true,
     products:[],
     totalPrice:0,
     type:'Delivery',
     paymentType:'cod',
     productNumber:0,
     isImageUpload:false,
   
 
    }
  }

  componentDidMount(){
    const { user } = this.props.state;

    
   
      this.retrieve()
      console.log("mount")
      this.willFocusSubscription = this.props.navigation.addListener(
        'willFocus',
        () => {
          this.retrieve()
          console.log("remount")
        }
      );

  }

  componentWillUnmount(){
    this.willFocusSubscription.remove()
  }

  retrieveFees=()=>
  {
    const parameter = {
    merchant_id:parseInt(this.state.data[0].merchant_id),
    latitude:parseFloat(this.props.state.location.latitude),
    longitude:parseFloat(this.props.state.location.longitude),
  }
  
    Api.request(Routes.shippingFee, parameter, response => {
      if(response!=null)
      {
        
        this.setState({shippingFee:response})
    }}, error => {
      console.log({ error })
      this.setState({shippingFee:null})
    })      
  }

    retrieve=async()=>
    {
    
      const { user } = this.props.state;
      if(user != null){
       const parameter = {
         condition : [{
           column: 'account_id',
           clause: '=',
           value: this.props.state.user.id
       }]
     }
     
     this.setState({
       isLoading: true
     })
     let products=this.props.state.cart;
     if(products.length>0)
     {
    await products.forEach(product=>
       {
         (product.price!=null || product.selectedVariation.length>0) ? this.setState({data:products}) : this.setState({data:products,priceMissing:true});
       })

       this.retrieveFees();
      
     }
     console.log("props",this.state.data)
     
   
    //  Api.request(Routes.cartsRetrieve, parameter, response => {
    //      if(response.data[0]!=null)
    //      {
          
    //      let products=JSON.parse(response.data[0].items)
    //       console.log("current data",products)
    //      products.forEach(product=>
    //       {
    //         product.price!=null ? this.setState({data:JSON.parse(response.data[0].items)}) : this.setState({data:JSON.parse(response.data[0].items),priceMissing:true});
    //         console.log(product)
    //         if(this.props.state.cart!=null)
    //         {
    //         this.props.addProductToCart(product)
    //         }
     
    //       })
    //       console.log(products)
    //       this.retrieveFees();
          
      
    //    }}, error => {
    //      console.log({ error })
    //    })

      

    //    console.log("henlo",this.props.state.cart)

       
 

       Api.request(Routes.locationRetrieve, parameter, response => {
         this.setState({isLoading: false})
        
         if(response.data.length > 0){
           this.setState({address: response.data.find(def=>{return def.id==parseInt(this.props.state.user.account_information.address)})})

         }
       },error => {
         console.log(error)
       });
       
       const idParams={
         account_id:this.props.state.user.id
       }
       Api.request(Routes.getValidID,idParams,response=>{
       
         if(response.data.length>0)
         {
          console.log("test",response)
          this.setState({validID:false});
        }
        else{
          this.setState({validID:true});
        }
         
      
       },
       error => {
        console.log("problem",error)})
     }
    }
 

  deliveryDetails=()=>{
    return(
      <React.Fragment>
        <View style={Style.DelvToContainer}><Text style={{fontSize:15}}>Deliver To</Text></View>
        <Divider style={{height:3}}/>
        <View style={Style.locationContainer}>
          <View style={{marginLeft:-10,width:'60%'}}>
            <View style={{flexDirection:'row'}}>
           <Text numberOfLines={1} style={{fontSize:14,fontWeight:'bold'}}>{this.props.state.location ? this.props.state.location.route :this.state.address.route ? this.state.address.route : "Current Location"}</Text>
           <TouchableOpacity onPress={() => this.goTo()}><FontAwesomeIcon style={{paddingRight:10}} icon={faEdit} color={'orange'}/></TouchableOpacity>
           </View>
           <Text numberOfLines={1} style={{fontSize:14,fontWeight:'bold'}}></Text>
           <Text numberOfLines={1} style={{fontSize:14,fontWeight:'bold'}}></Text>
           <Text numberOfLines={1}></Text>
          </View> 
          
          <MapView
    style={Style.map}
    provider={PROVIDER_GOOGLE}
    initialRegion={{ latitude: parseInt(this.props.state.location.latitude),
      longitude: parseInt(this.props.state.location.longitude),
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421}}
    >    
     <Marker
      coordinate={{ latitude: parseInt(this.props.state.location.latitude),
        latitudeDelta: 0.0922,
        longitude: parseInt(this.props.state.location.longitude),      
        longitudeDelta: 0.0421}}
    />
    </MapView>

        </View>
      </React.Fragment>
    )
  }
  goTo = () => {
    if (this.props.state.user == null) {
      const proceedToLogin = NavigationActions.navigate({
        routeName: 'loginStack'
      });
      this.props.navigation.dispatch(proceedToLogin)
      return
    }
    this.props.navigation.navigate('ChangeAddress')
  }

  renderAll=()=>
  {    
    if(this.state.showStatus==true)
    {
      this.setState({showStatus:false});
    }
    else
    {
      this.setState({showStatus:true});
    }
  }

  onAdd=(index)=>
  {
    const products=[...this.state.data]
    products[index].quantity+=1
    this.setState({data:products,products})
    

    const stringifyItems = JSON.stringify(products)
    const parameter = {
      account_id: this.props.state.user.id,
      items: stringifyItems
    }

    this.setState({ isLoading: true })
    Api.request(Routes.cartsCreate, parameter, response => {
      this.props.updateProductToCart(products[index])
      this.setState({ isLoading: false })
    }, error => {
      console.log({ error })
    })
    this.setState({productNumber:this.state.productNumber+1})
  }

  onVariationAdd=(index,variationIndex)=>
  {
    const products=[...this.state.data]
    products[index].selectedVariation[variationIndex].quantity+=1
    this.setState({data:products,products})
    console.log(this.state.data)
    
    const stringifyItems = JSON.stringify(products)
    const parameter = {
      account_id: this.props.state.user.id,
      items: stringifyItems
    }
    this.setState({ isLoading: true })
    Api.request(Routes.cartsCreate, parameter, response => {
      this.props.updateProductToCart(products[index]);
      console.log("response",response)
      this.setState({ isLoading: false })
    }, error => {
      console.log({ error })
    })
    

  }

  onSubtract=(index)=>
  {
    const { removeProductToCart } = this.props
    var products=[...this.state.data]
    if(products[index].quantity>1)
    {
      products[index].quantity-=1
      this.setState({productNumber:this.state.productNumber-1}) 
    }
    else if (products[index].quantity==1)
    {
    removeProductToCart(products[index]);
    products.splice(index,1)
    } 
    this.setState({data:products,products})
    const stringifyItems = JSON.stringify(products)
    const parameter = {
      account_id: this.props.state.user.id,
      items: stringifyItems
    }
    this.setState({ isLoading: true })
    Api.request(Routes.cartsCreate, parameter, response => {
     
      this.setState({ isLoading: false })
    }, error => {
      console.log({ error })
    })
  }
checkCart=()=>{
  console.log(this.state.data)
}
onVariationSubtract=(index,variationIndex)=>{
  const { removeProductToCart } = this.props
  var products=[...this.state.data]
 
  if(products[index].selectedVariation[variationIndex].quantity>1)
  {
    products[index].selectedVariation[variationIndex].quantity-=1
    
  }
  else if (products[index].selectedVariation[variationIndex].quantity==1)
  {
  removeProductToCart(products[index]);
  products[index].selectedVariation.splice(variationIndex,1)

  if(products[index].selectedVariation.length==0)
  {
    products.splice(index,1)
  }
  
  }

  this.setState({data:products,products})
  const stringifyItems = JSON.stringify(products)
  const parameter = {
    account_id: this.props.state.user.id,
    items: stringifyItems
  }
  this.setState({ isLoading: true })
  Api.request(Routes.cartsCreate, parameter, response => {
    this.props.updateProductToCart(products[index]);
    this.setState({ isLoading: false })
  }, error => {
    console.log({ error })
  }) 
}


 
 

  onCheckOut=(totalPrice)=>
  {
    const paymentType=this.state.paymentType.toLowerCase();


    if(this.state.data.length>0 && this.props.state.user.id!=null){
      if(this.state.amount_tendered!=null && this.state.amount_tendered<totalPrice)
      {
        this.setState({error:1})
      }
      else{
      const parameter= this.state.paymentType=="cod" && this.state.amount_tendered>0 ? {
        account_id:this.props.state.user.id,
        merchant_id:this.state.data[0].merchant_id,
        type:this.state.paymentType,
        product_attributes:"null",
        sub_total:totalPrice,
        tax:0,
        discount:0,
        total:totalPrice,
        payment_status:"pending",
        status:"pending",
        tendered_amount:this.state.amount_tendered,
        change:this.state.amount_tendered!=null ? parseInt(this.state.amount_tendered)-totalPrice : totalPrice,
        currency:"PHP",
        location_id:this.props.state.location?this.props.state.location.id : this.state.address.id,
        shipping_fee:this.state.shippingFee,
        latitude:this.props.state.location.latitude,
        longitude:this.props.state.location.longitude,
 
      } 
        :
        {
        account_id:this.props.state.user.id,
        merchant_id:this.state.data[0].merchant_id,
        type:this.state.paymentType,
        product_attributes:"null",
        sub_total:totalPrice,
        tax:0,
        discount:0,
        total:totalPrice,
        payment_status:"pending",
        status:"pending",
        currency:"PHP",
        location_id:this.props.state.location?this.props.state.location.id : this.state.address.id,
        shipping_fee:this.state.shippingFee,
        latitude:this.props.state.location.latitude,
        longitude:this.props.state.location.longitude,
     
      }

      this.setState({ isLoading: true })
      console.log(parameter)
      Api.request(Routes.checkoutCreate,parameter, response => {
        console.log('response',response)
        this.setState({ isLoading: false});
        this.props.navigation.navigate('MyOrders')
      }, error => {
        console.log({ error })
        this.setState({ isLoading: false })
        console.log(this.state.data)
      })
      }
      this.state.data.map(product=>{
          this.props.removeProductToCart(product)      
      })
    }
   
  }

  inputErrorCheck=(tenderedAmount,totalPrices)=>
  {
    
    if(tenderedAmount<totalPrices)
    {
      this.setState({amount_tendered:tenderedAmount.replace(/[^0-9]/g, '')})
      this.setState({error:1})
    }
    else{
      this.setState({amount_tendered:tenderedAmount.replace(/[^0-9]/g, '')})
      this.setState({error:0})
    }
  }

  uploadID=(url)=>{
    const parameter={
      account_id:this.props.state.user.id,
      file_url:url
    }
    Api.request(Routes.uploadValidID, parameter, response => {
    console.log(response)  
    alert("ID Successfully Uploaded")
    this.retrieve();
    }, error => {
      console.log( "this is uploadID error",error )

    })
  }

  clearCart=()=>
  {
    let products=[...this.state.data];
    products.map(product=>{
      if(product.price==null)
      {
        this.props.removeProductToCart(product)
      }
    })
    products=products.filter(def=>{
      return def.prices!=null
    })
    
    console.log(products)
    // console.log(this.state.data)
    this.setState({data:products,products})
    const stringifyItems = JSON.stringify(products)
    
    const parameter = {
      account_id: this.props.state.user.id,
      items: stringifyItems
    }

    this.setState({ isLoading: true })
    Api.request(Routes.cartsCreate, parameter, response => {
      console.log(response)
      this.setState({ isLoading: false,priceMissing:false })
      
    }, error => {
      console.log({ error })
    })
    this.setState({ isLoading: false })

  }

  checkOutButton=(totalPrices)=>
  {
   var variationLength=0;
   const count=this.state.data.filter(item=> item.selectedVariation.length>0).length
   this.state.data.map(product=>{
    if(product.selectedVariation.length>0)
    {
      product.selectedVariation.map(variation=>{
      variationLength+=variation.quantity;
      })
    }
  })

  variationLength-=count;
   console.log(count)
    return(
      <View style={{justifyContent:'center',width:'100%',flexDirection:'row'}}>
        
        {this.state.priceMissing==true? 
         <TouchableOpacity 
              style={{
                 position:'absolute',
                 justifyContent: 'center',
                 height: 50,
                 width: '80%',
                 borderRadius:10,
                 bottom:20,
                 backgroundColor: this.state.error ? '#CCCCCC' : '#FF5B04',
                 
               }} 
            onPress={() => {this.clearCart()}}
          >
          <Text style={{
                 color:'white',
                 alignSelf:'center',
                 
               }}>
            Clear Items
          </Text>
        </TouchableOpacity>
     : this.state.data[0]==null ? 
          <React.Fragment>
             <TouchableOpacity
             onPress={() => this.props.navigation.navigate('drawerStack')}
             style={{
              position:'absolute',
              justifyContent: 'center',
              height: 50,
              width: '80%',
              borderRadius:10,
              bottom:20,
              backgroundColor: this.state.error ? '#CCCCCC' : '#FF5B04',
              
            }}>
          <Text style={{
                 color:'white',
                 alignSelf:'center',
                 
               }}>
            Add Items to Cart
          </Text>
        </TouchableOpacity>
          </React.Fragment> :  
      
      <React.Fragment>
      <TouchableOpacity
               onPress={() => this.state.validID!=true ? this.onCheckOut(totalPrices) : this.setState({isImageUpload:true}) } 
               style={{
                 position:'absolute',
                 justifyContent: 'center',
                 height: 50,
                 width: '80%',
                 borderRadius:10,
                 bottom:20,
                 backgroundColor: this.state.error || this.state.shippingFee==null ? '#CCCCCC' : '#FF5B04',
                 
               }}
               disabled={this.state.error||this.state.shippingFee==null ? true : false}
               >
                 <View style={{flexDirection:'row',justifyContent:'space-between',marginRight:5}}>
               <View style={Style.circleContainer}><Text style={{alignSelf:'center',color:'#FF5B04'}}>
                 {this.state.data.length + this.state.productNumber + variationLength}
                 </Text></View>
               <Text style={{
                 color:'white',
                 alignSelf:'center',
                 marginLeft:40,
               }}>Place Order</Text>
                   <Text style={{
                 color:'white',
                 
               }}>₱{this.state.shippingFee!=null? (this.state.type=="Delivery"?totalPrices+this.state.shippingFee:totalPrices):null}</Text>
              </View>
         </TouchableOpacity>
         </React.Fragment>}
      </View> 
    )
  }
  render() {
    const {navigate} = this.props.navigation;
    const first=this.state.data.slice(0,2);
    const rest=this.state.data.slice(2);
    let totalPrices=0
    this.state.data.forEach(product=>{
      (product.price!=null || product.selectedVariation.length>0) &&
      (product.selectedVariation.length>0 ?
        
        product.selectedVariation.map(variation=>{
          totalPrices+=variation.quantity*variation.price
        })
        
        
        
        
        : totalPrices+=product.quantity*product.price[0].price )
    })
    return (
      <View style={{height:'100%',backgroundColor:'white'}}>
         {
          this.state.data[0]!=null ? 
         <ScrollView
      style={Style.ScrollView}
      onScroll={event => {
        if (event.nativeEvent.contentOffset.y <= 0) {
        }
      }}>
         
            <View style={{flexDirection:'row',justifyContent:'space-evenly',marginTop:25, marginBottom:15}}>
        <TouchableOpacity
              onPress={()=>{this.setState({type:"Delivery",paymentType:"cod"})}}
              style={this.state.type=="Delivery" ? Style.buttonPicked : Style.notPicked}
              >
              <Text style={{
                  color:this.state.type=="Delivery" ? '#FF5B04' : '#CCCCCC',
                textAlign: 'center',
                
              }}>Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity
             onPress={()=>{this.setState({type:"Pickup",paymentType:"cop",error:0})}}
             style={this.state.type=="Pickup" ? Style.buttonPicked : Style.notPicked}
              >
              <Text style={{
                color:this.state.type=="Pickup" ? '#FF5B04' : '#CCCCCC',
                textAlign: 'center',
                
              }}>Pickup</Text>
            </TouchableOpacity>
        </View>
       
        <Divider style={{height:3}}/>
        {
          (this.state.type=="Delivery" && this.props.state.location) ? this.deliveryDetails() : null
        }
        
    
        <View style={Style.TitleContainer}>
        <Text style={{fontSize:15}}>Your Order</Text>
         
        <TouchableOpacity onPress={() => {this.props.navigation.navigate('Merchant',this.state.data[0])}}>
          <Text style={{fontSize:15,color:'#FF5B04'}}>
            Add more Items
          </Text>
        </TouchableOpacity>
        
        </View>
        <Divider style={{height:3}}/>
        
          <View style={{ alignItems: 'center',width:'100%',backgroundColor:'white'}}>
             {
                first.map((product,index) => (
                  product.selectedVariation.length>0 ?
                  product.selectedVariation.map((variation,variationIndex)=>(
                    <CheckoutCard 
                    key={variation.id} 
                    details={product}
                    variation={variation} 
                    onSubtract={()=>this.onVariationSubtract(index,variationIndex)} 
                    onAdd={()=>this.onVariationAdd(index,variationIndex)} />
                  )):
                  <CheckoutCard 
                  key={product.id} 
                  details={product} 
                  onSubtract={()=>this.onSubtract(index)} 
                  onAdd={()=>this.onAdd(index)} />
                ))
              }

            {rest.length>0 && this.state.showStatus && (
            <TouchableOpacity 
            onPress={()=>this.renderAll()}>
              <Text style={{marginTop:15,fontSize:15,color:'#FF5B04'}}>
                Show More({rest.length})
              </Text>
            </TouchableOpacity> )}

            {this.state.showStatus ? null : rest.map((product,index)  => (
                product.selectedVariation.length>0 ?
                product.selectedVariation.map((variation,variationIndex)=>(
                  <CheckoutCard 
                  key={variation.id} 
                  details={product}
                  variation={variation} 
                  onSubtract={()=>this.onVariationSubtract(index,variationIndex)} 
                  onAdd={()=>this.onAdd(index+2)} />
                )):
            <CheckoutCard 
            key={product.id} 
            details={product} 
            onSubtract={()=>this.onSubtract(index+2)} 
            onAdd={()=>this.onAdd(index+2)} />
            ))
            }

            {this.state.showStatus? null : 
            <TouchableOpacity onPress={()=>this.renderAll()}>
              <Text style={{marginTop:15,fontSize:15,color:'#FF5B04'}}>
                Show Less
              </Text>
            </TouchableOpacity>}
         
          </View>
          <View style={{ marginTop:20,backgroundColor: "#FFFFFF" }}>
  <TearLines
    ref="top"
    color="#CCCCCC"
    backgroundColor="#FFFFF"
    tearSize={5}/>
     
  <View
    style={{ backgroundColor: "#CCCCC",padding:15 }}
    onLayout={e => {
      this.refs.top.onLayout(e);
      this.refs.bottom.onLayout(e);
    }} >
   <View style={{ flexDirection:'row', justifyContent:'space-between'}}>
      <Text style={{fontSize:15,fontWeight:'bold'}}>Subtotal</Text>
      <Text style={{fontSize:15,fontWeight:'bold'}}>{totalPrices}</Text>
    </View>
     {this.state.type=="Delivery" ?  <View style={{ flexDirection:'row', justifyContent:'space-between',marginTop:15}}>

      {this.state.shippingFee!=null ? (
        <React.Fragment>
           <Text style={{fontSize:15,fontWeight:'bold'}}>Delivery</Text>
           <Text style={{fontSize:15,fontWeight:'bold'}}>₱{this.state.shippingFee}</Text>
        </React.Fragment>
      ):
      <Text style={{marginBottom:5,
        alignSelf: 'center',
       justifyContent: 'center',
        color: Color.danger}}
        >Merchant does not have a location. Transaction cannot proceed, please try another merchant.
        </Text>}
     </View>: null}
     <Divider style={{height:3}}/>
     <View style={{ flexDirection:'row', justifyContent:'space-between',marginTop:15}}>
      <Text style={{fontSize:15,fontWeight:'bold'}}>Total</Text>
      {this.state.shippingFee!=null?<Text style={{fontSize:15,fontWeight:'bold'}}>₱{this.state.type=="Delivery"?totalPrices+this.state.shippingFee:totalPrices}</Text>:null}
     </View>
     <TearLines
    isUnder
    ref="bottom"
    color="#CCCCCC"
    tearSize={5}
    style={{marginTop:15}}
    backgroundColor="#FFFFFF"/>
  </View>

</View> 
{this.state.error ? 
<Text style={{height: 25,
 alignSelf: 'center',
justifyContent: 'center',
 color: Color.danger}}
 >Money on Hand is not enough for the Order!
 </Text> : 
 null}

{ this.state.paymentType=="cod" && 
(
<TextInput
keyboardType={"numeric"}
style={{padding:10,borderWidth:1,borderColor: this.state.error? Color.danger : '#CCCCCC',borderRadius:15,marginRight:50,marginLeft:50,marginBottom:10}}
onChangeText={(amount_tendered) => this.inputErrorCheck(amount_tendered,totalPrices)}
value={this.state.amount_tendered}
placeholder={'Money on Hand'}
/>
)
}
<TouchableOpacity onPress={()=>this.props.navigation.navigate('paymentOptions',{paymentType:this.state.paymentType})}>
<View style={{padding:15,borderWidth:1,borderColor:'#CCCCCC',borderRadius:15,marginRight:50,marginLeft:50,marginBottom:90}}>
  <View style={{flexDirection:'row', justifyContent:'space-between',marginTop:-10}}>
  <Text>Payment Options</Text>
  <Text style={{color:Color.primary}}>Change</Text>
  </View>
  <View style={{marginTop:15,flexDirection:'row',justifyContent:'space-between'}}>
  <Text>{this.state.paymentType==="cod"? "Cash on Delivery" : "Cash on Pickup"}</Text>
  <Text>₱{this.state.type=="Delivery"?totalPrices+this.state.shippingFee:totalPrices}</Text>
  </View>
</View>
</TouchableOpacity>
{this.state.isLoading ? <Spinner mode='overlay'/> : null}
     </ScrollView>: 
      <View style={{ marginTop: '20%', alignItems: 'center',marginBottom:100 }}>
      <Text>Looks like you don't have any orders yet</Text>
      <Text>What are you waiting for? {''}
        <Text
          onPress={() => navigate('Homepage')}
          style={{ color: Color.primary, fontWeight: 'bold' }}
        >
          Order now!
        </Text>
      </Text>
    </View>}
  
     {this.state.isLoading ? null :   
    this.checkOutButton(totalPrices) }
   
   {this.state.isImageUpload ? 
          <ImageUpload
            id={true}
            visible={this.state.isImageUpload}
            onSelect={(url) => {
              this.setState({isImageUpload: false, isLoading: false})
              this.uploadID(url)
            }}
            onClose={() => {
              this.setState({isImageUpload: false, isLoading: false})
            }}/> : null}
       
     </View>

    );
  }
}
const mapStateToProps = state => ({ state: state });

const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    removeProductToCart: (products) => dispatch(actions.removeProductToCart(products)),
    updateProductToCart: (products) => dispatch(actions.updateProductToCart(products)),
    addProductToCart: (products) => dispatch(actions.addProductToCart(products)),
    

  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    justifyContent:'space-between',
    marginBottom: 20,
  },
  checkbox: {
    alignSelf: "center",
  },
  label: {
    margin: 8,
  },
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(productCheckout);
