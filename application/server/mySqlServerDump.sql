-- MySQL dump 10.13  Distrib 8.0.23, for Linux (x86_64)
--
-- Host: 18.190.148.208    Database: SkillSeek
-- ------------------------------------------------------
-- Server version	8.0.23-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_recovery_hashes`
--

DROP TABLE IF EXISTS `account_recovery_hashes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_recovery_hashes` (
  `hash_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(66) NOT NULL,
  `associated_uid` bigint unsigned NOT NULL,
  `hash_expiry_date` date NOT NULL,
  PRIMARY KEY (`hash_id`),
  UNIQUE KEY `hash_id_UNIQUE` (`hash_id`),
  UNIQUE KEY `hash_UNIQUE` (`hash`),
  UNIQUE KEY `account_recovery_hashescol_UNIQUE` (`associated_uid`),
  CONSTRAINT `acc_recovery_uid` FOREIGN KEY (`associated_uid`) REFERENCES `users` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_recovery_hashes`
--

LOCK TABLES `account_recovery_hashes` WRITE;
/*!40000 ALTER TABLE `account_recovery_hashes` DISABLE KEYS */;
INSERT INTO `account_recovery_hashes` VALUES (14,'9930c7f6a4fbb93110d8d481a67bb9795ac914552b44d6ab58d837cd61fc810e',4090376368,'2021-05-09'),(15,'aefb091bb3d8e8fc394811ff8e3eb13e3d75743bc1fcf13a82c8967362ff36ac',1696713985,'2021-05-09');
/*!40000 ALTER TABLE `account_recovery_hashes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `connections`
--

DROP TABLE IF EXISTS `connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `connections` (
  `connections_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `connector_uid` bigint unsigned NOT NULL,
  `connected_uid` bigint unsigned NOT NULL,
  `pending` tinyint unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`connections_id`),
  UNIQUE KEY `connections_id_UNIQUE` (`connections_id`),
  KEY `con_connector_uid_idx` (`connector_uid`),
  KEY `con_connected_uid_idx` (`connected_uid`),
  CONSTRAINT `con_connected_uid` FOREIGN KEY (`connected_uid`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `con_connector_uid` FOREIGN KEY (`connector_uid`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `connections`
--

LOCK TABLES `connections` WRITE;
/*!40000 ALTER TABLE `connections` DISABLE KEYS */;
INSERT INTO `connections` VALUES (9,66997904,4090376368,0),(11,1226625680,4090376368,0),(12,1226625680,1696713985,0),(13,1696713985,66997904,0),(15,1696713985,4000516629,0),(17,1696713985,2306464671,0),(19,1696713985,495830151,1),(20,4236896400,1696713985,1),(21,2616460101,1696713985,0),(28,4288656786,2935012359,0),(29,4288656786,4236896400,1),(30,1696713985,4288656786,0);
/*!40000 ALTER TABLE `connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `education`
--

DROP TABLE IF EXISTS `education`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education` (
  `education_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fk_uid` bigint unsigned NOT NULL,
  `degree_type` varchar(64) NOT NULL,
  `degree_name` varchar(128) NOT NULL,
  `university` varchar(128) NOT NULL,
  `beginDate` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `ongoing` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`education_id`),
  UNIQUE KEY `education_id_UNIQUE` (`education_id`),
  KEY `edu_uid_idx` (`fk_uid`),
  FULLTEXT KEY `edu_search` (`degree_type`,`degree_name`,`university`),
  CONSTRAINT `edu_uid` FOREIGN KEY (`fk_uid`) REFERENCES `users` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `education`
--

LOCK TABLES `education` WRITE;
/*!40000 ALTER TABLE `education` DISABLE KEYS */;
INSERT INTO `education` VALUES (5,495830151,'Bachelor\'s Degree','Biology','San Francisco State University','2021-03-05','2021-03-08',0),(6,495830151,'Doctor of Medicine','Pediatrician','Harvard University','2021-03-10',NULL,1),(7,4090376368,'Bachelors','CS degree','SFSU','2017-09-21','2021-05-21',0),(10,1696713985,'Bachelor\'s of Science','Computer Scientist','San Francisco State University','2019-01-18','2021-12-20',0),(16,1696713985,'Bachelor\'s of Engineering','Electrical & Computer Engineering','San Francisco State University','2021-04-18',NULL,1),(17,2616460101,'Master','Prison','Alcatraz Prison','2021-05-02','2021-05-03',0),(18,2935012359,'Bacheleor','Computer Science ','San Francisco State University ','2021-05-11',NULL,1);
/*!40000 ALTER TABLE `education` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verification_hashes`
--

DROP TABLE IF EXISTS `email_verification_hashes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verification_hashes` (
  `hash_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(66) NOT NULL,
  `associated_uid` bigint unsigned NOT NULL,
  `hash_expiry_date` date NOT NULL,
  PRIMARY KEY (`hash_id`),
  UNIQUE KEY `hash_id_UNIQUE` (`hash_id`),
  UNIQUE KEY `hash_UNIQUE` (`hash`),
  UNIQUE KEY `associated_uid_UNIQUE` (`associated_uid`),
  CONSTRAINT `ver_associated_uid` FOREIGN KEY (`associated_uid`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verification_hashes`
--

LOCK TABLES `email_verification_hashes` WRITE;
/*!40000 ALTER TABLE `email_verification_hashes` DISABLE KEYS */;
INSERT INTO `email_verification_hashes` VALUES (26,'a605b1cbcfc0a7801b606b06a09bdd322b84f6759ac3d9dda0f9f8bf9aaa35da',1702535603,'2021-05-13'),(27,'a7a6f7948d9de4aad4e9259944da4add520f871b1a0e9ee89283daf3eeafdd1a',1053893783,'2021-05-13');
/*!40000 ALTER TABLE `email_verification_hashes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `experience`
--

DROP TABLE IF EXISTS `experience`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience` (
  `experience_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fk_uid` bigint unsigned NOT NULL,
  `employer` varchar(128) NOT NULL,
  `experience` varchar(128) NOT NULL,
  `description` varchar(512) DEFAULT NULL,
  `beginDate` date NOT NULL,
  `endDate` date DEFAULT NULL,
  `onGoing` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`experience_id`),
  UNIQUE KEY `experience_id_UNIQUE` (`experience_id`),
  KEY `exp_uid_idx` (`fk_uid`),
  CONSTRAINT `exp_uid` FOREIGN KEY (`fk_uid`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `experience`
--

LOCK TABLES `experience` WRITE;
/*!40000 ALTER TABLE `experience` DISABLE KEYS */;
INSERT INTO `experience` VALUES (1,1696713985,'asd','asd','asd','2021-04-04',NULL,1),(2,2935012359,'Starbucks','Barista','I was amazing at customer service in fact I got promoted as employee of the week . ','2021-05-11',NULL,1),(4,2935012359,'JC Penney','Retail Store','I am able to tailor desinger suits. ','2021-05-11',NULL,1),(5,2935012359,'MadDogzEntertainment','MC Rapper ','I make the best beats in South San Jose\r\nSoundCloud: wethebest','2021-05-11',NULL,1);
/*!40000 ALTER TABLE `experience` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobApplicant`
--

DROP TABLE IF EXISTS `jobApplicant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobApplicant` (
  `application_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `listing_id` bigint unsigned NOT NULL,
  `applicant_uid` bigint unsigned NOT NULL,
  PRIMARY KEY (`application_id`),
  UNIQUE KEY `application_id_UNIQUE` (`application_id`),
  KEY `job_applicant_uid_idx` (`applicant_uid`),
  KEY `job_listing_id_idx` (`listing_id`),
  CONSTRAINT `job_applicant_uid` FOREIGN KEY (`applicant_uid`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `job_listing_id` FOREIGN KEY (`listing_id`) REFERENCES `jobListing` (`listing_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobApplicant`
--

LOCK TABLES `jobApplicant` WRITE;
/*!40000 ALTER TABLE `jobApplicant` DISABLE KEYS */;
INSERT INTO `jobApplicant` VALUES (1,3,4090376368),(2,3,1696713985),(3,2,1696713985),(4,3,4236896400),(8,1,1696713985),(9,3,2935012359),(10,2,2935012359);
/*!40000 ALTER TABLE `jobApplicant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobListing`
--

DROP TABLE IF EXISTS `jobListing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobListing` (
  `listing_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `poster_id` bigint unsigned NOT NULL,
  `jobTitle` varchar(64) NOT NULL,
  `description` varchar(4096) NOT NULL,
  `location` varchar(128) NOT NULL,
  `expiryDate` date NOT NULL,
  `expired` tinyint unsigned NOT NULL DEFAULT '0',
  `hidden` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`listing_id`),
  UNIQUE KEY `listing_id_UNIQUE` (`listing_id`),
  KEY `listing_poster_uid_idx` (`poster_id`),
  FULLTEXT KEY `listing_search` (`jobTitle`,`location`),
  CONSTRAINT `listing_poster_uid` FOREIGN KEY (`poster_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobListing`
--

LOCK TABLES `jobListing` WRITE;
/*!40000 ALTER TABLE `jobListing` DISABLE KEYS */;
INSERT INTO `jobListing` VALUES (1,1226625680,'Junior Software Engineer','Can do the splits.','San Francisco, CA, USA','2021-05-11',0,0),(2,1226625680,'CEO','Cold blooded, untalented, and money hungry.','San Francisco, CA, USA','2021-05-07',1,0),(3,1226625680,'Chief Marketing Strategist','Talented at convincing individuals to do irrational things.','Remote','2021-05-31',0,0),(6,1226625680,'Leading Chef','Must have 20 year experience in the Five-Star Restaurant business.','San Francisco ','2021-05-26',0,0),(7,1226625680,'Front Office Desk Clerk ','Must be able to open doors for all employees and have a minimum requirement of Doctorate in Applied Mathematics and 20 experience in Microsoft Excel. ','San Francisco ','2021-05-30',0,0),(8,3321825036,'Software Enginneer','We want the best and the baddest Front End Programmer to defeat Skillseek. Also must have 30+ year expirence in React and Angular JS.    Starting Wage - 600 Euros ','Berlin Germany','2021-05-31',0,0),(9,3321825036,'Chef','We want the best Schnitzel Baker and also it helps if you know how to brew a good beer for OktoberFest.','Berlin Germany','2021-05-31',0,0),(10,3321825036,'Twitch Streamer','We need a Twitch Streamer who promotes our product while wearing exclusively exotic animal costumes .','Remote','2021-05-27',0,0);
/*!40000 ALTER TABLE `jobListing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profileIndividual`
--

DROP TABLE IF EXISTS `profileIndividual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profileIndividual` (
  `fk_uid` bigint unsigned NOT NULL,
  `profilepicture` varchar(4096) DEFAULT NULL,
  `resume` varchar(4096) DEFAULT NULL,
  `currentProfession` varchar(128) DEFAULT NULL,
  `description` varchar(4096) DEFAULT NULL,
  `gender` varchar(12) DEFAULT NULL,
  `location` varchar(128) DEFAULT NULL,
  `demographic` varchar(48) DEFAULT NULL,
  PRIMARY KEY (`fk_uid`),
  UNIQUE KEY `fk_uid_UNIQUE` (`fk_uid`),
  FULLTEXT KEY `profileInd_search` (`currentProfession`,`gender`,`location`,`demographic`),
  CONSTRAINT `profileInd_uid` FOREIGN KEY (`fk_uid`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profileIndividual`
--

LOCK TABLES `profileIndividual` WRITE;
/*!40000 ALTER TABLE `profileIndividual` DISABLE KEYS */;
INSERT INTO `profileIndividual` VALUES (131758917,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(495830151,'public/client_store/display_pictures/a5b5c3e748606fed5664f2f11cb5c6fac0a2a095ae1f.jpeg','public/client_store/resumes/82b3ffa38a117e4cb21eef23fd5e31a2dc7940606a61.pdf','Medical Student','Dummy account :)','Female','San Francisco, CA, USA','African American'),(1265179597,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(1696713985,'public/client_store/display_pictures/511612ff6dc3c98262fc9b09ce17f21c209a3896b7db.jpeg','public/client_store/resumes/3f7e1dfebcfb4dfc6b7c175c96cc2c38d2afa779060e.pdf','Computer Science Student','I like programming.','Male','Dubai, UAE','Human'),(1702535603,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2306464671,NULL,NULL,'Civil Engineering Student','Dummy account :)','Male','San Francisco, CA, USA','White'),(2341059305,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2616460101,NULL,NULL,'v','v','v','v','v'),(2935012359,'public/client_store/display_pictures/7bcb6e5da4dca8c3d9f199daba0ba017bf2889820c7d.jpeg','public/client_store/resumes/8741751bef9a1d6a9407aa4a5c24575bdf2ad5ed2e3c.pdf','Software Engineer','I like computers and i like coding ','Male ','San Jose ','Turkish'),(4000516629,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4090376368,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4236896400,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4288656786,'public/client_store/display_pictures/689b565acf37b407085116e618b80c2515bdf5e20449.jpeg',NULL,'Professor ','i like teaching students','Male ','San Francisco ','Hispanic');
/*!40000 ALTER TABLE `profileIndividual` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profileOrg`
--

DROP TABLE IF EXISTS `profileOrg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profileOrg` (
  `fk_uid` bigint unsigned NOT NULL,
  `logo` varchar(4096) DEFAULT NULL,
  `location` varchar(128) DEFAULT NULL,
  `description` varchar(4096) DEFAULT NULL,
  PRIMARY KEY (`fk_uid`),
  UNIQUE KEY `fk_uid_UNIQUE` (`fk_uid`),
  FULLTEXT KEY `profileOrg_search` (`location`),
  CONSTRAINT `profileOrg_uid` FOREIGN KEY (`fk_uid`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profileOrg`
--

LOCK TABLES `profileOrg` WRITE;
/*!40000 ALTER TABLE `profileOrg` DISABLE KEYS */;
INSERT INTO `profileOrg` VALUES (66997904,NULL,NULL,NULL),(1053893783,NULL,NULL,NULL),(1226625680,'public/client_store/org_logos/8e8b48edd2b149a74b2d19bf0d9aa6d83006374656bb.png','San Francisco, CA, USA','Talent finding service geared towards providing students with employment and buisnesses with talent.'),(3321825036,'public/client_store/org_logos/88805012ff3e2cc5d82e0f84796df7423033a8eb3d9b.jpeg','Berlin Germany','We are Skillseek\'s worst enemy.');
/*!40000 ALTER TABLE `profileOrg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rating`
--

DROP TABLE IF EXISTS `rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rating` (
  `rating_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(64) NOT NULL,
  `review` varchar(4096) NOT NULL,
  `rating` tinyint unsigned NOT NULL,
  `rater` bigint unsigned NOT NULL,
  `rated` bigint unsigned NOT NULL,
  `dateRated` date DEFAULT NULL,
  PRIMARY KEY (`rating_id`),
  UNIQUE KEY `rating_id_UNIQUE` (`rating_id`),
  KEY `rater_uid_idx` (`rater`),
  KEY `rated_uid_idx` (`rated`),
  CONSTRAINT `rated_uid` FOREIGN KEY (`rated`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `rater_uid` FOREIGN KEY (`rater`) REFERENCES `users` (`uid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rating`
--

LOCK TABLES `rating` WRITE;
/*!40000 ALTER TABLE `rating` DISABLE KEYS */;
INSERT INTO `rating` VALUES (1,'Great','Good job.',10,4288656786,1696713985,'2021-04-12'),(2,'Bad','Bad job',0,4288656786,1696713985,'2021-04-12'),(3,'good job','great',10,4288656786,1696713985,'2021-04-14'),(4,'good job team leader','Great job leading team. Good presentation.',10,4288656786,2935012359,'2021-05-11'),(5,'Get a Grammar Checker','Ali after thoroughly looking at your contributions i can clearly see that you need to use Grammarly. ',10,4288656786,4090376368,'2021-05-11');
/*!40000 ALTER TABLE `rating` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('KEpOvbLHl7-wCvmY8S9UEpip5vuwVEBE',1620761737,'{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2021-05-11T19:35:37.081Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('_8b-d75Zxh6-an4fGX0EEGzxTZZZEHMC',1620763893,'{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2021-05-11T20:11:33.051Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"username\":\"emusayev\",\"userId\":\"2935012359\",\"accountType\":\"student\",\"isStudent\":true,\"reqUserProfile\":\"zay\",\"requestedAccountType\":\"student\"}'),('f-xDXhhqVhNHZP1_Dcojsn9W_-7j9Vd-',1620762639,'{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2021-05-11T19:50:39.053Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('mADs-gWzgyNW_C3e-9D_FcTo5AX8b278',1620764142,'{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2021-05-11T20:15:41.883Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('s_5Jlfnzif5GsHu5Gk5bFkXh_fdFgh8Q',1620762474,'{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2021-05-11T19:45:24.562Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('tSOjPLsLZqWOnn7RCOE_lTiaJCZ5xXny',1620765141,'{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2021-05-11T20:32:21.034Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}'),('vYUsdu8iywCyHOYlqlOpvcaF7JAL0WXQ',1620762041,'{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2021-05-11T19:34:31.182Z\",\"secure\":true,\"httpOnly\":true,\"path\":\"/\"},\"flash\":{}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `uid` bigint unsigned NOT NULL,
  `username` varchar(64) NOT NULL,
  `password` varchar(64) NOT NULL,
  `firstname` varchar(128) NOT NULL,
  `lastname` varchar(128) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `accType` varchar(10) NOT NULL,
  `verified` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`),
  UNIQUE KEY `uid_UNIQUE` (`uid`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `emai;_UNIQUE` (`email`),
  FULLTEXT KEY `user_search` (`firstname`,`lastname`,`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (66997904,'begumorg','zaBsohRwZ/xJNVMS9WXj3uwHfpcZMJVk2DWgxjG2U3w=','sfsuokul',NULL,'onursendag@gmail.com','2008-03-16','employer',1),(131758917,'begumsakin22','zaBsohRwZ/xJNVMS9WXj3uwHfpcZMJVk2DWgxjG2U3w=','begum','sakin','begumsakin12@gmail.com','1995-03-18','teacher',1),(495830151,'janedoe','6O0vF1H+aeY2S3X7SfxhnQF6d0T/h+8w8G810jCfHXw=','Jane','Doe','r1a3chahine@gmail.com','2021-03-03','student',1),(1053893783,'arrqw','i0wu1PMuC8rKmVTX+aXwrG3SwDxzVJXZjI0H77wPKSM=','acompany',NULL,'123123@asdq.com','2021-05-11','employer',0),(1226625680,'skillseek','6O0vF1H+aeY2S3X7SfxhnQF6d0T/h+8w8G810jCfHXw=','SkillSeek',NULL,'skillseek@outlook.com','2021-01-25','employer',1),(1265179597,'12hassan34','/FrDlErtUdMXBkf/PkYIrycu7Xzok4XEm/iNv1YPdS0=','hassan','khan','buaah86@gmail.com','1997-04-27','student',1),(1696713985,'zay','6O0vF1H+aeY2S3X7SfxhnQF6d0T/h+8w8G810jCfHXw=','Ramzi','Abou Chahine','r1a9chahine@gmail.com','2021-03-04','student',1),(1702535603,'dinatale','uz6J46tADOtxgiy6VPsip8bZdbuxJWqdDncKhxiVQHc=','Antonio ',NULL,'antoniodinataleudinesse69@gmail.com','1993-06-24','student',0),(2306464671,'johnsmith','6O0vF1H+aeY2S3X7SfxhnQF6d0T/h+8w8G810jCfHXw=','John','Smith','ramzia.chahine@gmail.com','2021-03-04','student',1),(2341059305,'begumstudent','zaBsohRwZ/xJNVMS9WXj3uwHfpcZMJVk2DWgxjG2U3w=','begum','thestudent','bsakin@mail.sfsu.edu','1995-03-07','student',1),(2616460101,'vdao','KjWf7rjkiKGvLAO5CLPteZBABVXbc+FCEYHZfKwATUg=','v','v','dtv.18297@gmail.com','2021-05-02','student',1),(2935012359,'emusayev','dWnJcZnkAjM+kKjjeuXiV4AKbtRQMR3oGZoNRNOsrWA=','Emin ','Musayev','emin.musayev619@gmail.com','1998-07-21','student',1),(3321825036,'letsmoveforward','L8bRMGKaIN4EpIwLda7m5ZJ0DGaVA/ihEz5LOpyIleQ=','Spark Carrers',NULL,'emusayev21@icloud.com','1978-01-01','employer',1),(4000516629,'ramziac','6O0vF1H+aeY2S3X7SfxhnQF6d0T/h+8w8G810jCfHXw=','ramzi','abou chahine','ramzi.abou.chahine@hotmail.com','2021-03-05','student',1),(4090376368,'checknection','/FrDlErtUdMXBkf/PkYIrycu7Xzok4XEm/iNv1YPdS0=','Ali','Khan','binsabira1@gmail.com','1999-03-30','student',1),(4236896400,'emusayev1','XPa8R5WgxmJ9SOwGv8qLyZOofRgHu5vciW6uTP1o5mk=','Emin ','Musayev','emusayev@mail.sfsu.edu','1987-07-21','student',1),(4288656786,'profvillar','KjWf7rjkiKGvLAO5CLPteZBABVXbc+FCEYHZfKwATUg=','Henry','Villar','ramziAChahine@pm.me','2021-03-10','teacher',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'SkillSeek'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `expiryCheck` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`project`@`%`*/ /*!50106 EVENT `expiryCheck` ON SCHEDULE EVERY 1 DAY STARTS '2021-03-24 00:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
		CALL updateJobListings();
        CALL purgeUnverifiedAccounts();
	END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'SkillSeek'
--
/*!50003 DROP PROCEDURE IF EXISTS `getProfileInfo` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`project`@`%` PROCEDURE `getProfileInfo`(
IN userName VARCHAR(64)
)
BEGIN
DECLARE accountType VARCHAR(10);
    
	SELECT 
    users.accType
INTO @accountType FROM
    users
WHERE
    users.username = userName
LIMIT 1; 
    
    IF @accountType = 'employer' THEN
		SELECT users.uid, users.username, users.email, users.firstname, users.accType, users.dateOfBirth,
        profileOrg.logo, profileOrg.location, profileOrg.description
        FROM users INNER JOIN profileOrg ON users.uid = profileOrg.fk_uid WHERE users.username = userName;
	ELSE
		SELECT users.uid, users.username, users.email, users.firstname, users.lastname, users.dateOfBirth, users.accType, profileIndividual.currentProfession, 
        profileIndividual.profilepicture, profileIndividual.resume, profileIndividual.gender, profileIndividual.demographic,
        profileIndividual.description, profileIndividual.location
        FROM users INNER JOIN profileIndividual ON users.uid = profileIndividual.fk_uid 
        WHERE users.username = userName;
	END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `purgeUnverifiedAccounts` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`project`@`%` PROCEDURE `purgeUnverifiedAccounts`()
BEGIN
	DECLARE currRow BIGINT DEFAULT 0;
	DECLARE numOfRows BIGINT DEFAULT 0;
    DECLARE rowUserId BIGINT DEFAULT 0;
    DECLARE rowDate DATE DEFAULT NULL;
    
    SELECT COUNT(*) FROM `SkillSeek`.`email_verification_hashes` INTO @numOfRows;
    SET @currRow = 0;
    
    PREPARE statementDate FROM "SELECT hash_expiry_date FROM `SkillSeek`.`email_verification_hashes` LIMIT ?, 1 INTO @outvar;";
    PREPARE statementID FROM "SELECT associated_uid FROM `SkillSeek`.`email_verification_hashes` LIMIT ?, 1 INTO @outvar;";
    
    WHILE @currRow < @numOfRows DO
		EXECUTE statementDate USING @currRow;
        SET @rowDate = @outvar;
		
        IF DATEDIFF(@rowDate, UTC_DATE) <= 0 THEN
			EXECUTE statementID USING @currRow;
            SET @rowUserID = @outvar;
            
            DELETE FROM `SkillSeek`.`users` WHERE uid = @rowUserId;
            
            SET @numOfRows = @numOfRows - 1;
		ELSE
			SET @currRow = @currRow + 1;
        END IF;
	END WHILE;
    DEALLOCATE PREPARE statementDate;
	DEALLOCATE PREPARE statementID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `test` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`project`@`%` PROCEDURE `test`()
BEGIN
	DECLARE currRow BIGINT DEFAULT 0;
    DECLARE rowUserId BIGINT DEFAULT 0;
    DECLARE numOfRows BIGINT DEFAULT 0;
    
    SELECT COUNT(*) FROM `SkillSeek`.`email_verification_hashes` INTO @numOfRows;
    SET @currRow = 0;
    
	PREPARE statementDate FROM "SELECT hash_expiry_date FROM `SkillSeek`.`email_verification_hashes` LIMIT ?, 1 INTO @outvar;";
    
    -- WHILE @currRow < @numOfRows DO
		EXECUTE statementDate USING @currRow;
        SET @rowDate = @outvar;
        SELECT DATEDIFF(@rowDate, UTC_DATE);
    
    -- END WHILE;
    DEALLOCATE PREPARE statementDate;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `updateJobListings` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`project`@`%` PROCEDURE `updateJobListings`()
BEGIN
	DECLARE currRow BIGINT DEFAULT 0;
	DECLARE numOfRows BIGINT DEFAULT 0;
    DECLARE rowId BIGINT DEFAULT 0;
    DECLARE rowDate DATE DEFAULT NULL;
        
	SELECT COUNT(*) FROM `SkillSeek`.`jobListing` INTO @numOfRows;
    SET @currRow = 0;
    
    PREPARE statementDate FROM "SELECT expiryDate FROM `SkillSeek`.`jobListing` LIMIT ?, 1 INTO @outvar;";
    PREPARE statementID FROM "SELECT listing_id FROM `SkillSeek`.`jobListing` LIMIT ?, 1 INTO @outvar;";
        
    WHILE @currRow < @numOfRows DO
		EXECUTE statementDate USING @currRow;
		SET @rowDate =  @outvar;

 		IF DATEDIFF(@rowDate, UTC_DATE) < -60 THEN  -- if 2 months since expiry
			EXECUTE statementID USING @currRow;
            SET @rowId = @outvar;
			
            DELETE FROM `SkillSeek`.`jobListing` WHERE listing_id = @rowId;
                
			SET @numOfRows = @numOfRows - 1;
		
        ELSEIF DATEDIFF(@rowDate, UTC_DATE) < 0 THEN -- if has expired
			EXECUTE statementID USING @currRow;
            SET @rowId = @outvar;
			
            UPDATE `SkillSeek`.`jobListing` SET expired = 1 WHERE listing_id = @rowId;
			SET @currRow = @currRow + 1;
            
		ELSE
			SET @currRow = @currRow + 1;
		END IF;
			 
	END WHILE;
	DEALLOCATE PREPARE statementDate;
	DEALLOCATE PREPARE statementID;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-05-11 23:38:38
