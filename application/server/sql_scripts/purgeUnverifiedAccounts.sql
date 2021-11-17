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
END