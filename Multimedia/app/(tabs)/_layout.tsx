import React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Button, Text } from 'react-native';
import { Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';


export default function TabLayout() {
  const [sound, setSound] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [songs, setSongs] = useState<Array<{id: number, name: string, filepath: string}>>([]);
  const db = SQLite.openDatabaseSync('playlist.db');

  useEffect(() =>{
    const setupDatabase = async() =>{
      try{
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT UNIQUE, 
            filepath TEXT UNIQUE
          )`
        );
        await addLocalSongsToDatabase();
        await loadSongs();
        setIsLoading(false);
      }catch (error){
        console.error(error);
        setIsLoading(false);
      }
    };

    setupDatabase();
  }, []);

  useEffect(() => { return sound ? () => { sound.unloadAsync();}: undefined; }, [sound]);

  const addLocalSongsToDatabase= async() =>{
    try{
      await db.runAsync(
        'INSERT INTO songs (name, filepath) VALUES (?, ?)',
        ['Night in Tunisia', '../../assets/NightInTunisia.mp3']
      );
    }catch(error){
      console.error(error);
    }
  };

  const loadSongs= async() =>{
    try{
      const songList: Array<{ id: number; name: string; filepath: string }> = [];
      for await (const row of db.getEachAsync('SELECT * FROM songs') as AsyncIterable<{ 
        id: number; 
        name: string; 
        filepath: string 
      }>) {
        songList.push({
          id: row.id,
          name: row.name,
          filepath: row.filepath,
        });
      }
      setSongs(songList);
    }catch(error){
      console.error(error);
    }
  };

  const playSound= async() =>{
    try{
      if(sound){
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/NightInTunisia.mp3')
      );
      setSound(newSound);
      await newSound.playAsync();
    }catch(error){
      console.error(error);
    }
  };

  const stopSound= async() =>{
    try{
      if(sound){
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
    }catch (error){
      console.error('Error stopping sound:', error);
    }
  };

  if(isLoading){
    return(
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Play" onPress={playSound} />
        <Button title="Stop" onPress={stopSound} />
      </View>
      
      <View style={styles.songList}>
        <Text style={styles.heading}>Available Songs:</Text>
        {songs.map((song) => (
          <View key={song.id} style={styles.songItem}>
            <Text>{song.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  songList: {
    marginTop: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  songItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginVertical: 5,
  }
});