import React from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="play">
        <Icon sf={{ default: 'gamecontroller', selected: 'gamecontroller.fill' }} />
        <Label>Play</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="spin">
        <Icon sf={{ default: 'arrow.trianglehead.2.clockwise.rotate.90', selected: 'arrow.trianglehead.2.clockwise.rotate.90' }} />
        <Label>Spin</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feed">
        <Icon sf={{ default: 'newspaper', selected: 'newspaper.fill' }} />
        <Label>Feed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rewards">
        <Icon sf={{ default: 'gift', selected: 'gift.fill' }} />
        <Label>Rewards</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const safeAreaInsets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const tabBarHeight = isWeb ? 56 : 56 + safeAreaInsets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: width >= 320,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_500Medium',
          marginTop: -2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          minWidth: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: isWeb ? 0 : safeAreaInsets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) =>
            isIOS ? (
              <SymbolView name="house.fill" tintColor={color} size={20} />
            ) : (
              <Feather name="home" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gamecontroller.fill" tintColor={color} size={20} />
            ) : (
              <Ionicons name="game-controller-outline" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="spin"
        options={{
          title: 'Spin',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="rays" tintColor={color} size={20} />
            ) : (
              <MaterialCommunityIcons name="refresh-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="newspaper.fill" tintColor={color} size={20} />
            ) : (
              <Feather name="rss" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gift.fill" tintColor={color} size={20} />
            ) : (
              <Feather name="gift" size={20} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={20} />
            ) : (
              <Feather name="user" size={20} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  // NativeTabs (Liquid Glass) is iOS-only — guard explicitly so Android
  // never attempts to render it, which would crash at runtime.
  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
