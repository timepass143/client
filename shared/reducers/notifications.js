// @flow
import * as Constants from '../constants/notifications'
import * as NotificationsGen from '../actions/notifications-gen'
import * as Tabs from '../constants/tabs'
import * as RPCTypes from '../constants/types/flow-types'
import {isMobile} from '../constants/platform'

const initialState: Constants.State = Constants.makeState()

const _updateWidgetBadge = (s: Constants.State): Constants.State => {
  let widgetBadge = 'regular'
  if (s.getIn(['keyState', 'kbfsUploading'])) {
    widgetBadge = 'uploading'
  } else if (s.desktopAppBadgeCount) {
    widgetBadge = 'badged'
  }

  return s.set('widgetBadge', widgetBadge)
}

export default function(
  state: Constants.State = initialState,
  action: NotificationsGen.Actions
): Constants.State {
  switch (action.type) {
    case NotificationsGen.resetStore:
      return initialState
    case NotificationsGen.receivedBadgeState: {
      const {
        conversations,
        newTlfs,
        rekeysNeeded,
        newGitRepoGlobalUniqueIDs,
        newTeamNames,
        newTeamAccessRequests,
      } = action.payload.badgeState

      const deviceType = isMobile ? RPCTypes.commonDeviceType.mobile : RPCTypes.commonDeviceType.desktop
      const totalMessages = (conversations || [])
        .reduce((total, c) => (c.badgeCounts ? total + c.badgeCounts[`${deviceType}`] : total), 0)
      const newGit = (newGitRepoGlobalUniqueIDs || []).length
      const newTeams = (newTeamNames || []).length + (newTeamAccessRequests || []).length

      const navBadges = state.get('navBadges').withMutations(n => {
        n.set(Tabs.chatTab, totalMessages)
        n.set(Tabs.folderTab, newTlfs + rekeysNeeded)
        n.set(Tabs.gitTab, newGit)
        n.set(Tabs.teamsTab, newTeams)
      })
      let newState = state.withMutations(s => {
        s.set('navBadges', navBadges)
        s.set('desktopAppBadgeCount', navBadges.reduce((total, val) => total + val, 0))
        s.set('mobileAppBadgeCount', totalMessages)
      })

      newState = _updateWidgetBadge(newState)
      return newState
    }
    case NotificationsGen.badgeApp:
      const {key, on} = action.payload
      let newState = state.update('keyState', ks => ks.set(key, on))
      newState = _updateWidgetBadge(newState)
      return newState
  }
  return state
}
