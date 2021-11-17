
DROP EVENT IF EXISTS expiryCheck; 

DELIMITER $$
CREATE EVENT expiryCheck 
ON SCHEDULE EVERY 1 DAY
STARTS '2021-02-12 00:00:00'
	DO 
	BEGIN
		CALL updateJobListings();
        CALL purgeUnverifiedAccounts();
	END $$
DELIMITER ;
