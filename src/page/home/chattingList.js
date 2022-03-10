import styles from './styles.module.scss'
import _ from 'lodash'
import { useMemo } from 'react'
import { useStoreState } from '@store'
import moment from 'moment'
import { usePopupManager } from '@context/popupManager' 
import ChattingRoom from '@popup/chattingRoom'

function ChattingList() {
  const store = useStoreState()
  const popupManager = usePopupManager()

  const userRelationMap = useMemo( () => {
    return _.keyBy( store.userRelationList, 'userId' )
  }, [ store.userRelationList ] )

  const renderList = useMemo( () => {
    console.log( store.chattingRoomList )
    const parsedChattingRoomList = _.map( store.chattingRoomList, chattingRoom => {
      let date, text, userStr, fromUserList
      const firstMessage = _( store.messageList )
        .filter( ( { roomId } ) => roomId === chattingRoom.roomId )
        .maxBy( 'createDate' )
      
      if( firstMessage ) {
        date = firstMessage.createDate
        text = firstMessage.text
      } else {
        date = chattingRoom.createDate 
        text = '' 
      }

      try {
        fromUserList = JSON.parse( chattingRoom.roomUser )
      } catch( err ) {
        console.error( err )
      }
      
      userStr = _( fromUserList ).map( userId => {
        return userId === store.user.userId ? store.user.name :
           _.get( userRelationMap, `${userId}.name` ) || '알수없음'
      } ).join( ',' )

      return {
        date, 
        userStr,
        text, 
        fromUserList,
        formatDate: moment( date, 'x' ).format( 'MM월 DD일' ),
        roomId: chattingRoom.roomId,
        key: `room_${chattingRoom.roomId}`
      }
    } )

    const persedMessageList = _( store.messageList )
      .filter( ( { roomId } ) => !roomId )
      .map( message => {
        let key 
        if( message.sendUserId === store.user.userId ) {
          key = `user_${message.fromUserId}`
        } else {
          key = `user_${message.sendUserId}`
        }
        return { ...message, key }
      } )
      .groupBy( 'key' )
      .map( ( messageList, key ) => {
        const firstMessage = _.maxBy( messageList, 'createDate' )
        
        let fromUser
        if( firstMessage.sendUserId === store.user.userId ) {
          fromUser = firstMessage.fromUserId
        } else {
          fromUser = firstMessage.sendUserId
        }
        fromUser = _.get( userRelationMap, fromUser ) || {}

        return {
          date: firstMessage.createDate,
          formatDate: moment( firstMessage.createDate, 'x' ).format( 'MM월 DD일' ),
          text: firstMessage.text,
          userStr: fromUser.name,
          fromUserList: [ fromUser.userId ],
          key
        }
      } ).value()

      return _( parsedChattingRoomList )
        .concat( persedMessageList )
        .orderBy( 'createDate', 'desc' )
        .value()
      
  }, [ store.chattingRoomList, store.messageList, userRelationMap, store.user.userId ] )

  const openChattingRoom = ( messageFaceInfo ) => {
    const { fromUserList, roomId } = messageFaceInfo
    popupManager.open( ChattingRoom, { fromUserList, roomId } )
  } 
   
  return (
    <>
      { renderList && renderList.map( item => {
        return <div className={styles.room_area} key={item.key} onClick={() => openChattingRoom( item )}>
          <div className={styles.contents}>
            <div className={styles.room_title}>
              <div className={styles.text_gard}>
                {item.userStr}
              </div>
            </div>
            <div className={styles.text}>
              <div className={styles.text_gard}>
                {item.text}
              </div>
            </div>
          </div>
          <div className={styles.date}>
            {item.formatDate}
          </div>
        </div>
      } ) }
    </>
  )
}

export default ChattingList