import React, { useState } from "react";
import {, color: "primary.main" }}>{a.icon}</Box>import { Box, Container, Typography, Grid, Card, CardContent } from "@mui/material";
                  <Typography fontWeight={600}>{a.title}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
import { MenuBook, Spa, CalendarMonth, CompassCalibration } from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";
import PrayerTimes from "../components/PrayerTimes/PrayerTimes";
import PrayerCompassInline from "../components/Qibla/PrayerCompassInline";

const Home = ({ onAuthAction }) => {
  const { user } = useAuth();
  const [showQibla, setShowQibla] = useState(false);

  const actions = [
    { title: "Quran", icon: <MenuBook />, action: "/quran" },
    { title: "Dhikr / Du’a", icon: <Spa />, action: "/dua" },
    { title: "Qibla", icon: <CompassCalibration />, action: "qibla" },
    { title: "Calendar", icon: <CalendarMonth />, action: "/calendar" }
  ];

  return (
    <Box sx={{ pb: 2 }}>
      <Container maxWidth="md">
        <PrayerTimes />

        {showQibla && <Box mt={3}><PrayerCompassInline /></Box>}

        <Typography fontWeight={600} mt={3} mb={1}>Quick Actions</Typography>

        <Grid container spacing={2}>
          {actions.map((a, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Card
                onClick={() => a.action === "qibla" ? setShowQibla(true) : window.location.href = a.action}
                sx={{ textAlign: "center", p: 2, cursor: "pointer", borderRadius: 3 }}
              >
                <CardContent>
