import { createDrawerNavigator } from '@react-navigation/drawer';
import type { DrawerParamList } from './types';
import MainTabs from './MainTabs';
import ProfileDrawerContent from './ProfileDrawerContent';
import { colors } from '../theme/tokens';

const Drawer = createDrawerNavigator<DrawerParamList>();

// Wraps the bottom tabs in a drawer so the profile panel can slide in from the
// header avatar. The drawer itself is header-less (each tab screen renders its
// own AppHeader with the avatar/menu button); its content is the custom
// ProfileDrawerContent.
export default function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Tabs"
      drawerContent={(props) => <ProfileDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: colors.paper,
          width: 300,
          borderRightWidth: 2,
          borderRightColor: colors.ink,
        },
        swipeEdgeWidth: 40,
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Drawer.Screen name="Tabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}
