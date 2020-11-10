library(tidyverse) 

augData <- read.csv("2020-08-19-home_panel_summary.csv")
octData <- read.csv("2020-10-21-home_panel_summary.csv")


augDataClean <- filter(augData, census_block_group >= 360610193000 & census_block_group <= 360610219000 
       & as.integer(census_block_group/1000) %% 2 != 0) %>% select(census_block_group,number_devices_residing)
octDataClean <- filter(octData, census_block_group >= 360610193000 & census_block_group <= 360610219000 
                  & as.integer(census_block_group/1000) %% 2 != 0) %>% select(census_block_group,number_devices_residing)

#setdiff(augData$census_block_group,octData$census_block_group)
octDataClean <- octDataClean %>% add_row(census_block_group = 360610199000, number_devices_residing = 0)
octDataClean <- octDataClean %>% add_row(census_block_group = 360610195000, number_devices_residing = 0)

df <- merge(augDataClean,octDataClean,by='census_block_group')     
names(df)[names(df)=="number_devices_residing.x"] <- "aug"
names(df)[names(df)=="number_devices_residing.y"] <- "oct"

df$census_block = floor(df$census_block_group/10)

aggDf <- aggregate(df,by = list(df$census_block),FUN = sum) %>% select(Group.1,aug,oct)
names(aggDf)[names(aggDf)=="Group.1"] <- "census_tract"

write.csv(aggDf,"aggregated_data.csv")
