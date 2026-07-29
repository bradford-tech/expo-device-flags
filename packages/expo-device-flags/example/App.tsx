import * as ExpoDeviceFlags from '@bradford-tech/expo-device-flags';
import { useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function App() {
  const [asyncSupported, setAsyncSupported] = useState<boolean | null>(null);
  const [tokenResult, setTokenResult] = useState('(not requested yet)');

  useEffect(() => {
    ExpoDeviceFlags.isSupportedAsync().then(setAsyncSupported);
  }, []);

  const requestToken = async () => {
    try {
      const token = await ExpoDeviceFlags.requestDeviceTokenAsync();
      setTokenResult(`token (${token.length} chars): ${token.slice(0, 24)}…`);
    } catch (error) {
      const code =
        error instanceof Error && 'code' in error ? error.code : 'unknown';
      setTokenResult(`error ${String(code)}: ${String(error)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>DeviceCheck Example</Text>
        <Group name="isSupported (constant)">
          <Text>{String(ExpoDeviceFlags.isSupported)}</Text>
        </Group>
        <Group name="isSupportedAsync()">
          <Text>{asyncSupported === null ? 'loading…' : String(asyncSupported)}</Text>
        </Group>
        <Group name="requestDeviceTokenAsync()">
          <Button title="Request device token" onPress={requestToken} />
          <Text>{tokenResult}</Text>
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: { fontSize: 30, margin: 20 },
  groupHeader: { fontSize: 20, marginBottom: 20 },
  group: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  container: { flex: 1, backgroundColor: '#eee' },
};
