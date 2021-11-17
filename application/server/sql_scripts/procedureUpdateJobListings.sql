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
		SET rowDate =  @outvar;

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
END