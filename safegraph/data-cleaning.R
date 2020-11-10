library(tidyverse)

augData <- read.csv("2020-08-19-home_panel_summary.csv") %>% filter(grepl("^36061", census_block_group))
octData <- read.csv("2020-10-21-home_panel_summary.csv") %>% filter(grepl("^36061", census_block_group))

octData <- octData %>% add_row(census_block_group = 360610199000, number_devices_residing = 0)
octData <- octData %>% add_row(census_block_group = 360610195000, number_devices_residing = 0)

df <- merge(augData, octData, by='census_block_group')
names(df)[names(df)=="number_devices_residing.x"] <- "aug"
names(df)[names(df)=="number_devices_residing.y"] <- "oct"

df$census_tract = floor(df$census_block_group/10)

aggDf <- df %>% 
  group_by(census_tract) %>% 
  summarize(aug = sum(aug), oct = sum(oct))

write.csv(aggDf,"../data/home_panel_change.csv", row.names = FALSE)
