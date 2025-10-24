import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Paper,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  Mosque,
  Book,
  AccessTime,
  Psychology
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Calendar = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Fajr Prayer', completed: true, type: 'prayer' },
    { id: 2, text: 'Morning Dhikr', completed: true, type: 'dhikr' },
    { id: 3, text: 'Read Quran - 1 page', completed: false, type: 'quran' },
    { id: 4, text: 'Dhuhr Prayer', completed: false, type: 'prayer' },
    { id: 5, text: 'Learn new Hadith', completed: false, type: 'knowledge' },
  ]);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        completed: false,
        type: 'custom'
      }]);
      setNewTask('');
    }
  };

  const handleToggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'prayer': return <Mosque sx={{ color: '#0D9488' }} />;
      case 'quran': return <Book sx={{ color: '#F59E0B' }} />;
      case 'dhikr': return <Psychology sx={{ color: '#8B5CF6' }} />;
      default: return <AccessTime sx={{ color: '#64748B' }} />;
    }
  };

  const getTaskColor = (type) => {
    switch (type) {
      case 'prayer': return '#0D9488';
      case 'quran': return '#F59E0B';
      case 'dhikr': return '#8B5CF6';
      default: return '#64748B';
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Typography variant={isMobile ? "h5" : "h4"} fontWeight="700" gutterBottom>
        Daily Spiritual Tasks
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Plan and track your spiritual activities for today
      </Typography>

      {/* Progress Summary */}
      <Card sx={{ mb: 3, backgroundColor: 'rgba(13, 148, 136, 0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight="600" color="#0D9488">
                Today's Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedTasks} of {totalTasks} tasks completed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="700" color="#0D9488">
                {Math.round((completedTasks / totalTasks) * 100)}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Add Task */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Add New Task
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g., Evening reflection, Read Surah Al-Kahf..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddTask}
              sx={{ flexShrink: 0 }}
            >
              Add Task
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Today's Tasks
          </Typography>
          {tasks.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No tasks for today. Add some tasks to get started!
            </Typography>
          ) : (
            <List>
              {tasks.map((task) => (
                <ListItem
                  key={task.id}
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: 2,
                    mb: 1,
                    backgroundColor: task.completed ? 'rgba(13, 148, 136, 0.05)' : 'background.paper'
                  }}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      onClick={() => handleDeleteTask(task.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      sx={{ color: getTaskColor(task.type) }}
                    />
                  </ListItemIcon>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getTaskIcon(task.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body1"
                        sx={{ 
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {task.text}
                      </Typography>
                    }
                    secondary={
                      <Chip 
                        label={task.type} 
                        size="small"
                        sx={{ 
                          backgroundColor: getTaskColor(task.type) + '20',
                          color: getTaskColor(task.type),
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Suggestions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Quick Add Spiritual Tasks
          </Typography>
          <Grid container spacing={1}>
            {[
              { text: 'Tahajjud Prayer', type: 'prayer' },
              { text: 'Morning Adhkar', type: 'dhikr' },
              { text: 'Quran Reflection', type: 'quran' },
              { text: 'Charity Planning', type: 'custom' },
            ].map((suggestion, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: '1px solid #E2E8F0',
                    '&:hover': {
                      backgroundColor: 'rgba(13, 148, 136, 0.05)',
                      borderColor: '#0D9488'
                    }
                  }}
                  onClick={() => {
                    setTasks([...tasks, {
                      id: Date.now(),
                      text: suggestion.text,
                      completed: false,
                      type: suggestion.type
                    }]);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTaskIcon(suggestion.type)}
                    <Typography variant="body2" fontWeight={500}>
                      {suggestion.text}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Calendar;