/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  Image,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, TextPath, LinearGradient, Stop } from 'react-native-svg';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNPickerSelect from 'react-native-picker-select';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const gaugeContainerWidth = width - 80;
const gaugeWidth = gaugeContainerWidth * 0.9;
const radius = gaugeWidth / 2;
const centerX = gaugeContainerWidth / 2;
const centerY = radius;
const strokeWidth = 6;

const polarToCartesian = (angle) => {
  const angleInRadians = ((angle - 180) * Math.PI) / 180.0;
  const x = centerX + radius * Math.cos(angleInRadians);
  const y = centerY + radius * Math.sin(angleInRadians);
  return { x, y };
};

const describeArc = (startAngle, endAngle) => {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const interpolateColor = (color1, color2, factor) => {
    let result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
    }
    return result;
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

const rgbToHex = (rgb) => {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1).padStart(6, '0');
};

const getIndicatorColor = (bmi) => {
    if (bmi < 16) return '#3498db';
    if (bmi < 18.5) {
        const factor = (bmi - 16) / (18.5 - 16);
        return rgbToHex(interpolateColor(hexToRgb('#3498db'), hexToRgb('#85c1e9'), factor));
    }
    if (bmi < 25) {
        const factor = (bmi - 18.5) / (25 - 18.5);
        return rgbToHex(interpolateColor(hexToRgb('#2ecc71'), hexToRgb('#82e0aa'), factor));
    }
    if (bmi <= 40) {
        const factor = (bmi - 25) / (40 - 25);
        return rgbToHex(interpolateColor(hexToRgb('#e74c3c'), hexToRgb('#f5b7b1'), factor));
    }
    return '#f5b7b1';
};

const getAngleForBmi = (bmi) => {
    if (bmi <= 16) return 0;
    if (bmi < 18.5) return ((bmi - 16) / (18.5 - 16)) * 62;
    if (bmi < 25) return 62 + ((bmi - 18.5) / (25 - 18.5)) * (125 - 62);
    if (bmi <= 40) return 125 + ((bmi - 25) / (40 - 25)) * (180 - 125);
    return 180;
};

const getBmiCategoryDetails = (bmi, gender, age) => {
    const ageNum = parseInt(age) || 25;
    
    // For children (under 18), use pediatric BMI percentiles
    if (ageNum < 18) {
        // Pediatric BMI categories are different
        if (bmi < 18.5) return { category: 'Underweight', color: '#3498db' };
        if (bmi < 25) return { category: 'Normal', color: '#2ecc71' };
        if (bmi < 30) return { category: 'Overweight', color: '#e74c3c' };
        return { category: 'Obese', color: '#e74c3c' };
    }
    
    if (gender === 'male') {
        if (bmi < 18.5) return { category: 'Underweight', color: '#3498db' };
        if (bmi < 25) return { category: 'Normal', color: '#2ecc71' };
        if (bmi < 30) return { category: 'Overweight', color: '#e74c3c' };
        if (bmi < 35) return { category: 'Obese', color: '#e74c3c' };
        return { category: 'Severely Obese', color: '#e74c3c' };
    } else {
        // Females typically have slightly different body composition
        if (bmi < 18.5) return { category: 'Underweight', color: '#3498db' };
        if (bmi < 24) return { category: 'Normal', color: '#2ecc71' };
        if (bmi < 29) return { category: 'Overweight', color: '#e74c3c' };
        if (bmi < 34) return { category: 'Obese', color: '#e74c3c' };
        return { category: 'Severely Obese', color: '#e74c3c' };
    }
};

const getDetailedBmiCategoryName = (bmi, gender, age) => {
    const ageNum = parseInt(age) || 25;
    
    // For children (under 18), use simplified categories
    if (ageNum < 18) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }
    
    if (gender === 'male') {
        if (bmi <= 15.9) return 'Very Severely Underweight';
        if (bmi >= 16.0 && bmi <= 16.9) return 'Severely Underweight';
        if (bmi >= 17.0 && bmi <= 18.4) return 'Underweight';
        if (bmi >= 18.5 && bmi <= 24.9) return 'Normal';
        if (bmi >= 25.0 && bmi <= 29.9) return 'Overweight';
        if (bmi >= 30.0 && bmi <= 34.9) return 'Obese Class I';
        if (bmi >= 35.0 && bmi <= 39.9) return 'Obese Class II';
        if (bmi >= 40.0) return 'Obese Class III';
    } else {
        // Slightly different ranges for females
        if (bmi <= 15.9) return 'Very Severely Underweight';
        if (bmi >= 16.0 && bmi <= 16.9) return 'Severely Underweight';
        if (bmi >= 17.0 && bmi <= 18.4) return 'Underweight';
        if (bmi >= 18.5 && bmi <= 23.9) return 'Normal';
        if (bmi >= 24.0 && bmi <= 28.9) return 'Overweight';
        if (bmi >= 29.0 && bmi <= 33.9) return 'Obese Class I';
        if (bmi >= 34.0 && bmi <= 38.9) return 'Obese Class II';
        if (bmi >= 39.0) return 'Obese Class III';
    }
    return null;
};

const getBMICategories = (gender, age) => {
    const ageNum = parseInt(age) || 25;
    
    // For children (under 18), use simplified categories
    if (ageNum < 18) {
        return [
            { name: 'Underweight', range: '< 18.5' },
            { name: 'Normal', range: '18.5 - 24.9' },
            { name: 'Overweight', range: '25.0 - 29.9' },
            { name: 'Obese', range: '≥ 30.0' },
        ];
    }
    
    if (gender === 'male') {
        return [
            { name: 'Very Severely Underweight', range: '≤ 15.9' },
            { name: 'Severely Underweight', range: '16.0 - 16.9' },
            { name: 'Underweight', range: '17.0 - 18.4' },
            { name: 'Normal', range: '18.5 - 24.9' },
            { name: 'Overweight', range: '25.0 - 29.9' },
            { name: 'Obese Class I', range: '30.0 - 34.9' },
            { name: 'Obese Class II', range: '35.0 - 39.9' },
            { name: 'Obese Class III', range: '≥ 40.0' },
        ];
    } else {
        return [
            { name: 'Very Severely Underweight', range: '≤ 15.9' },
            { name: 'Severely Underweight', range: '16.0 - 16.9' },
            { name: 'Underweight', range: '17.0 - 18.4' },
            { name: 'Normal', range: '18.5 - 23.9' },
            { name: 'Overweight', range: '24.0 - 28.9' },
            { name: 'Obese Class I', range: '29.0 - 33.9' },
            { name: 'Obese Class II', range: '34.0 - 38.9' },
            { name: 'Obese Class III', range: '≥ 39.0' },
        ];
    }
};

// Simple storage implementation
const Storage = {
  async getItem(key) {
    try {
      // For now, use a simple in-memory storage
      // In a real app, you'd use AsyncStorage or another storage solution
      return global.__bmiHistoryStorage?.[key] || null;
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  },
  
  async setItem(key, value) {
    try {
      // For now, use a simple in-memory storage
      if (!global.__bmiHistoryStorage) {
        global.__bmiHistoryStorage = {};
      }
      global.__bmiHistoryStorage[key] = value;
    } catch (error) {
      console.error('Error setting item:', error);
    }
  }
};

const App = () => {
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');
  const [gender, setGender] = useState('female');
  const [activeInput, setActiveInput] = useState('age');
  const [bmi, setBmi] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [indicatorPosition, setIndicatorPosition] = useState(polarToCartesian(0));

  const [heightUnit, setHeightUnit] = useState('cm');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('8');

  // History state
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentHistoryEntry, setCurrentHistoryEntry] = useState(null);

  const ageInputRef = useRef(null);
  const heightInputRef = useRef(null);
  const weightInputRef = useRef(null);
  const inputRefs = {
    age: ageInputRef,
    height: heightInputRef,
    weight: weightInputRef,
  };

  useEffect(() => {
    const listener = animatedValue.addListener((v) => setIndicatorPosition(polarToCartesian(v.value)));
    return () => animatedValue.removeListener(listener);
  }, [animatedValue]);

  useEffect(() => {
    if (inputRefs[activeInput]?.current) {
      inputRefs[activeInput].current.focus();
    }
  }, [activeInput]);

  useEffect(() => {
    calculateBmi();
  }, [height, weight, age, heightUnit, weightUnit, gender]);
  
  useEffect(() => {
    const targetAngle = getAngleForBmi(bmi);
    LayoutAnimation.easeInEaseOut();
    Animated.timing(animatedValue, {
      toValue: targetAngle,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [bmi]);

  // Load history on app start
  useEffect(() => {
    loadHistory();
  }, []);

  // Save history when it changes
  useEffect(() => {
    saveHistory();
  }, [history]);

  const handleHeightUnitChange = (newUnit) => {
    if (!newUnit || newUnit === heightUnit) return;
    
    const currentValue = parseFloat(height);
    if(isNaN(currentValue)) return;

    if (newUnit === 'in') { // cm to in
        setHeight((currentValue / 2.54).toFixed(1));
    } else if (newUnit === 'ft') { // cm to ft
        const totalInches = currentValue / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFeet(String(feet));
        setHeightInches(String(inches));
        setHeight((totalInches * 2.54).toFixed(1)); // Keep cm value for calculation
    } else { // in to cm or ft to cm
        if (heightUnit === 'in') {
            setHeight((currentValue * 2.54).toFixed(0));
        } else if (heightUnit === 'ft') {
            const totalInches = (parseInt(heightFeet) * 12) + parseInt(heightInches);
            setHeight((totalInches * 2.54).toFixed(0));
        }
    }
    setHeightUnit(newUnit);
  };

  const handleFeetChange = (value) => {
    setHeightFeet(value);
    const totalInches = (parseInt(value) * 12) + parseInt(heightInches);
    setHeight((totalInches * 2.54).toFixed(1));
  };

  const handleInchesChange = (value) => {
    setHeightInches(value);
    const totalInches = (parseInt(heightFeet) * 12) + parseInt(value);
    setHeight((totalInches * 2.54).toFixed(1));
  };

  const handleWeightUnitChange = (newUnit) => {
    if (!newUnit || newUnit === weightUnit) return;

    const currentValue = parseFloat(weight);
    if(isNaN(currentValue)) return;
    
    if (newUnit === 'lbs') { // kg to lbs
        setWeight((currentValue * 2.20462).toFixed(1));
    } else { // lbs to kg
        setWeight((currentValue / 2.20462).toFixed(1));
    }
    setWeightUnit(newUnit);
  };

  const calculateBmi = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    
    if (h <= 0 || w <= 0) {
      setBmi(0);
      return;
    }

    const heightInCm = heightUnit === 'in' ? h * 2.54 : h;
    const weightInKg = weightUnit === 'lbs' ? w / 2.20462 : w;
    
    const heightInMeters = heightInCm / 100;
    
    if (heightInMeters > 0 && weightInKg > 0) {
        setBmi(weightInKg / (heightInMeters ** 2));
    } else {
        setBmi(0);
    }
  };

  // History management functions
  const loadHistory = async () => {
    try {
      const savedHistory = await Storage.getItem('bmiHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveHistory = async () => {
    try {
      await Storage.setItem('bmiHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const addToHistory = () => {
    if (bmi <= 0) return;
    
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      bmi: bmi.toFixed(1),
      age: age,
      height: height,
      weight: weight,
      heightUnit: heightUnit,
      weightUnit: weightUnit,
      gender: gender,
      category: category,
      color: color,
    };

    setHistory(prevHistory => [newEntry, ...prevHistory.slice(0, 49)]); // Keep only last 50 entries
  };

  const deleteHistoryEntry = (id) => {
    setHistory(prevHistory => prevHistory.filter(entry => entry.id !== id));
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all BMI history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setHistory([]),
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const { category, color } = getBmiCategoryDetails(bmi, gender, age);
  const indicatorColor = getIndicatorColor(bmi);
  const detailedCategoryName = getDetailedBmiCategoryName(bmi, gender, age);

  let difference;
  const h = parseFloat(height);
  if (h > 0 && bmi > 0) {
    const heightInCm = heightUnit === 'in' ? h * 2.54 : h;
    const heightInMeters = heightInCm / 100;
    const heightSquared = heightInMeters * heightInMeters;

    let weightDiffKg = 0;
    let sign = '';

    // Use gender-specific ranges for difference calculation
    const ageNum = parseInt(age) || 25;
    let normalBmiMin, normalBmiMax;
    
    // For children (under 18), use pediatric BMI ranges
    if (ageNum < 18) {
        normalBmiMin = 18.5;
        normalBmiMax = 24.9; // Standard pediatric normal range
    } else {
        // Age can affect target BMI ranges for adults
        normalBmiMin = gender === 'male' ? 18.5 : 18.5;
        normalBmiMax = gender === 'male' ? 24.9 : 23.9;
        
        // For older adults (65+), slightly higher BMI may be acceptable
        if (ageNum >= 65) {
            normalBmiMax = gender === 'male' ? 27.0 : 26.0;
        }
        // For young adults (18-24), slightly stricter ranges
        else if (ageNum < 25) {
            normalBmiMax = gender === 'male' ? 24.0 : 23.0;
        }
    }

    if (bmi < normalBmiMin) {
      weightDiffKg = (normalBmiMin - bmi) * heightSquared;
      sign = '-';
    } else if (bmi > normalBmiMax) {
      weightDiffKg = (bmi - normalBmiMax) * heightSquared;
      sign = '+';
    }

    if (weightDiffKg > 0) {
      if (weightUnit === 'kg') {
        difference = `${sign}${weightDiffKg.toFixed(1)} kg`;
      } else { // lbs
        const weightDiffLbs = weightDiffKg * 2.20462;
        difference = `${sign}${weightDiffLbs.toFixed(1)} lbs`;
      }
    } else {
      difference = 'Normal Weight';
    }
  } else {
    difference = '...';
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>BMI Calculator</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistoryModal(true)}>
              <Text style={styles.historyButtonText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={() => {
              setAge('0');
              setHeight('0');
              setWeight('0');
              setHeightFeet('0');
              setHeightInches('0');
              setHeightUnit('cm');
              setWeightUnit('kg');
            }}>
              <Image source={require('./assets/remove-button.png')} style={styles.resetButtonImage} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.tabs}>
            {['age', 'height', 'weight'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeInput === tab && styles.activeTab]}
                onPress={() => setActiveInput(tab)}
              >
                <Text style={[styles.tabText, activeInput === tab && styles.activeTabText]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                <View style={styles.inputWrapper}>
                  {tab === 'height' && heightUnit === 'ft' ? (
                    <View style={styles.feetInchesContainer}>
                      <TextInput
                        style={[styles.feetInchesInput, activeInput !== tab && styles.inactiveInput]}
                        value={heightFeet}
                        onChangeText={handleFeetChange}
                        keyboardType="numeric"
                        editable={activeInput === tab}
                      />
                      <Text style={styles.feetInchesLabel}>'</Text>
                      <TextInput
                        style={[styles.feetInchesInput, activeInput !== tab && styles.inactiveInput]}
                        value={heightInches}
                        onChangeText={handleInchesChange}
                        keyboardType="numeric"
                        editable={activeInput === tab}
                      />
                      <Text style={styles.feetInchesLabel}>"</Text>
                      <RNPickerSelect
                        value={tab === 'height' ? heightUnit : weightUnit}
                        onValueChange={
                          tab === 'height'
                            ? handleHeightUnitChange
                            : handleWeightUnitChange
                        }
                        items={
                          tab === 'height'
                            ? [{ label: 'cm', value: 'cm' }, { label: 'ft', value: 'ft' }]
                            : [{ label: 'kg', value: 'kg' }, { label: 'lbs', value: 'lbs' }]
                        }
                        style={pickerSelectStyles}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => <Image source={require('./assets/arrow-down-icon.png')} style={styles.pickerIcon} />}
                      />
                    </View>
                  ) : (
                    <>
                      <TextInput
                        ref={inputRefs[tab]}
                        style={[styles.input, activeInput !== tab && styles.inactiveInput]}
                        value={{ age, height, weight }[tab]}
                        onChangeText={{ age: setAge, height: setHeight, weight: setWeight }[tab]}
                        keyboardType="numeric"
                        editable={activeInput === tab}
                      />
                      {tab === 'age' ? (
                        <Text style={styles.unitPlaceholder}></Text>
                      ) : (
                        <RNPickerSelect
                          value={tab === 'height' ? heightUnit : weightUnit}
                          onValueChange={
                            tab === 'height'
                              ? handleHeightUnitChange
                              : handleWeightUnitChange
                          }
                          items={
                            tab === 'height'
                              ? [{ label: 'cm', value: 'cm' }, { label: 'ft', value: 'ft' }]
                              : [{ label: 'kg', value: 'kg' }, { label: 'lbs', value: 'lbs' }]
                          }
                          style={pickerSelectStyles}
                          useNativeAndroidPickerStyle={false}
                          Icon={() => <Image source={require('./assets/arrow-down-icon.png')} style={styles.pickerIcon} />}
                        />
                      )}
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.genderSelector}>
          <TouchableOpacity onPress={() => setGender('male')}>
            <Image 
              source={require('./assets/man.png')} 
              style={[styles.genderIcon, {backgroundColor: gender === 'male' ? '#e3f2fd' : 'transparent'}]} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGender('female')}>
            <Image 
              source={require('./assets/woman.png')} 
              style={[styles.genderIcon, {backgroundColor: gender === 'female' ? '#fdeff2' : 'transparent'}]} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.gaugeContainer}>
          <Svg width={gaugeContainerWidth} height={radius + 30} viewBox={`-20 -20 ${gaugeContainerWidth + 40} ${radius + 50}`}>
            <Defs>
              <Path id="textArc" d={describeArc(0, 180)} />
              <LinearGradient id="underweightGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#3498db" />
                <Stop offset="100%" stopColor="#85c1e9" />
              </LinearGradient>
              <LinearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#2ecc71" />
                <Stop offset="100%" stopColor="#82e0aa" />
              </LinearGradient>
              <LinearGradient id="overweightGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#e74c3c" />
                <Stop offset="100%" stopColor="#f5b7b1" />
              </LinearGradient>
            </Defs>
            <G>
              <Path d={describeArc(0, 180)} stroke="#f0f0f0" strokeWidth={strokeWidth} fill="none" />
              <Path d={describeArc(0, 62)} stroke="url(#underweightGrad)" strokeWidth={strokeWidth} fill="none" />
              <Path d={describeArc(62, 125)} stroke="url(#normalGrad)" strokeWidth={strokeWidth} fill="none" />
              <Path d={describeArc(125, 180)} stroke="url(#overweightGrad)" strokeWidth={strokeWidth} fill="none" />

              <G>
                <SvgText fill={category === 'Underweight' ? indicatorColor : '#333'} dy="-6" style={{fontSize: 11, fontWeight: '500'}}>
                    <TextPath href="#textArc" startOffset="12.5%" textAnchor="middle">Underweight</TextPath>
                </SvgText>
                <SvgText fill={category === 'Normal' ? indicatorColor : '#333'} dy="-6" style={{fontSize: 11, fontWeight: '500'}}>
                    <TextPath href="#textArc" startOffset="40%" textAnchor="middle">Normal</TextPath>
                </SvgText>
                <SvgText fill={category === 'Overweight' ? indicatorColor : '#333'} dy="-6" style={{fontSize: 11, fontWeight: '500'}}>
                    <TextPath href="#textArc" startOffset="75%" textAnchor="middle">Overweight</TextPath>
                </SvgText>
              </G>

              <SvgText x={centerX} y={centerY - 20} textAnchor="middle" fontSize="16" fill="#a0a0a0" fontWeight="bold">BMI</SvgText>
              <SvgText x={centerX} y={centerY + 8} textAnchor="middle" fontSize="32" fill={color} fontWeight="bold">
                {bmi.toFixed(1)}
              </SvgText>

              <G elevation="3" shadowColor="#000" shadowOffset={{ width: 0, height: 1 }} shadowOpacity={0.3} shadowRadius={1}>
                 <Circle cx={indicatorPosition.x} cy={indicatorPosition.y} r={8} fill={indicatorColor} />
              </G>
            </G>
            <SvgText x={polarToCartesian(0).x} y={polarToCartesian(0).y+25} fill="#666" fontSize="10" textAnchor="middle" transform={`rotate(-90, ${polarToCartesian(0).x}, ${polarToCartesian(0).y+25})`}>16.0</SvgText>
            <SvgText x={polarToCartesian(62).x} y={polarToCartesian(62).y+25} fill="#666" fontSize="10" textAnchor="middle" transform={`rotate(-45, ${polarToCartesian(62).x}, ${polarToCartesian(62).y+25})`}>18.5</SvgText>
            <SvgText x={polarToCartesian(125).x} y={polarToCartesian(125).y+25} fill="#666" fontSize="10" textAnchor="middle" transform={`rotate(45, ${polarToCartesian(125).x}, ${polarToCartesian(125).y+25})`}>25.0</SvgText>
            <SvgText x={polarToCartesian(180).x} y={polarToCartesian(180).y+25} fill="#666" fontSize="10" textAnchor="middle" transform={`rotate(90, ${polarToCartesian(180).x}, ${polarToCartesian(180).y+25})`}>40.0</SvgText>
          </Svg>
        </View>

        <View style={styles.resultsCard}>
            <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Category</Text>
                <Text style={[styles.resultValue, {color}]}>{category}</Text>
            </View>
            <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Difference</Text>
                <Text style={[styles.resultValue, { color }]}>{difference}</Text>
            </View>
            {bmi > 0 && (
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: color }]} onPress={addToHistory}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
        </View>

        <View style={styles.categoryListCard}>
            {getBMICategories(gender, age).map((item) => {
                const isHighlighted = item.name === detailedCategoryName;
                return (
                    <View 
                        key={item.name} 
                        style={[
                            styles.categoryItem, 
                            isHighlighted 
                                ? { backgroundColor: `${color}20`, borderRadius: 8 }
                                : { borderBottomWidth: 1, borderBottomColor: '#f7f7f7' }
                        ]}
                    >
                        <Text style={[styles.categoryName, isHighlighted && { color: color, fontWeight: '600' }]}>{item.name}</Text>
                        <Text style={[styles.categoryRange, isHighlighted && { color: color, fontWeight: '600' }]}>{item.range}</Text>
                    </View>
                )
            })}
        </View>
      </ScrollView>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowHistoryModal(false)}>
              <Image source={require('./assets/remove-button.png')} style={styles.closeButtonImage} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>BMI History</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <Text style={styles.clearButtonText}>🗑️ Clear All</Text>
            </TouchableOpacity>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryIcon}>📊</Text>
              <Text style={styles.emptyHistoryText}>No history yet</Text>
              <Text style={styles.emptyHistorySubtext}>Save your BMI calculations to see them here</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                    <TouchableOpacity onPress={() => deleteHistoryEntry(item.id)}>
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.historyItemContent}>
                    <View style={styles.historyBmiSection}>
                      <Text style={[styles.historyBmi, { color: item.color }]}>{item.bmi}</Text>
                      <Text style={styles.historyBmiLabel}>BMI</Text>
                    </View>
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyCategory}>{item.category}</Text>
                      <Text style={styles.historyMeasurements}>
                        {item.height}{item.heightUnit === 'ft' ? "'" : item.heightUnit} • {item.weight}{item.weightUnit} • {item.age} years • {item.gender}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.historyList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF9F3',
  },
  container: {
    padding: 15,
    alignItems: 'center',
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: '300',
    color: '#333',
  },
  resetButton: {
    padding: 5,
  },
  resetButtonImage: {
    width: 20,
    height: 20,
  },
  inputSection: {
    width: '100%',
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE0D5',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#c78c5c',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
    marginBottom: 8,
  },
  activeTabText: {
    color: '#c78c5c',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
    paddingVertical: 0,
  },
  inactiveInput: {
    color: '#a0a0a0',
  },
  unit: {
    fontSize: 14,
    marginLeft: 3,
  },
  pickerIcon: {
    width: 10,
    height: 10,
    marginTop: 12,
  },
  genderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    resizeMode: 'contain',
  },
  unitPlaceholder: {
    width: 30, // to align with picker
  },
  genderSelector: {
    flexDirection: 'row',
    width: '50%',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 15,
      padding: 15,
      backgroundColor: 'rgba(255,255,255,0.7)',
      borderRadius: 15,
  },
  resultBox: {
      alignItems: 'center',
  },
  resultLabel: {
      fontSize: 14,
      color: '#888',
      marginBottom: 5,
      fontWeight: '400',
  },
  resultValue: {
      fontSize: 14,
      fontWeight: '600',
  },
  categoryListCard: {
      width: '100%',
      padding: 15,
      backgroundColor: '#fff',
      borderRadius: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
  },
  categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginVertical: 1,
  },
  categoryName: {
      fontSize: 14,
      color: '#555',
  },
  categoryRange: {
      fontSize: 14,
      color: '#333',
      fontWeight: '500',
  },
  feetInchesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feetInchesInput: {
    width: 40,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
    paddingVertical: 0,
  },
  feetInchesLabel: {
    fontSize: 14,
    marginHorizontal: 5,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e74c3c',
  },
  closeButton: {
    padding: 8,
    paddingHorizontal: 12,
  },
  closeButtonImage: {
    width: 24,
    height: 24,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHistoryIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#ccc',
    marginBottom: 10,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#888',
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 12,
    color: '#888',
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyBmiSection: {
    alignItems: 'center',
  },
  historyBmi: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyBmiLabel: {
    fontSize: 12,
    color: '#888',
  },
  historyDetails: {
    flex: 1,
    marginLeft: 15,
  },
  historyCategory: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 5,
  },
  historyMeasurements: {
    fontSize: 12,
    color: '#666',
  },
  historyList: {
    padding: 10,
  },
  historyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e74c3c',
  },
  buttonSpacer: {
    width: 10,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingRight: 25, // to ensure the text is never behind the icon
    color: '#333',
  },
  inputAndroid: {
    fontSize: 14,
    paddingRight: 25, // to ensure the text is never behind the icon
    color: '#333',
  },
  iconContainer: {
    top: 4,
    right: 5,
  },
});

export default App; 